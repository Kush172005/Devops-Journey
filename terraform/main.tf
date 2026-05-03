# AWS Academy–friendly: uses existing LabRole (no IAM role resources).
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  lab_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
}

resource "random_id" "bucket_suffix" {
  byte_length = 3
}

data "aws_subnet" "ecs" {
  id = var.subnet_id
}

data "aws_subnets" "in_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_subnet.ecs.vpc_id]
  }
}

locals {
  vpc_subnet_lookup_ids = slice(sort(data.aws_subnets.in_vpc.ids), 0, min(32, length(data.aws_subnets.in_vpc.ids)))
}

data "aws_subnet" "vpc_lookup" {
  for_each = toset(local.vpc_subnet_lookup_ids)
  id       = each.value
}

locals {
  ecs_az = data.aws_subnet.ecs.availability_zone
  alternate_subnet_ids = [
    for sid in local.vpc_subnet_lookup_ids : sid
    if data.aws_subnet.vpc_lookup[sid].availability_zone != local.ecs_az
  ]
  alb_subnet_b = trimspace(var.subnet_id_2) != "" ? var.subnet_id_2 : (
    length(local.alternate_subnet_ids) > 0 ? local.alternate_subnet_ids[0] : var.subnet_id
  )
  alb_subnet_ids = distinct([var.subnet_id, local.alb_subnet_b])
}

resource "aws_security_group" "alb" {
  name_prefix = "${var.app_name}-alb-"
  description = "HTTP from internet to ALB"
  vpc_id      = data.aws_subnet.ecs.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}

resource "aws_security_group_rule" "ecs_tasks_from_alb" {
  type                     = "ingress"
  from_port                = var.container_port
  to_port                  = var.container_port
  protocol                 = "tcp"
  security_group_id        = var.security_group_id
  source_security_group_id = aws_security_group.alb.id
  description              = "Allow ALB to reach ECS tasks"
}

resource "aws_lb" "app" {
  name               = substr("${var.app_name}-alb-${random_id.bucket_suffix.hex}", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.alb_subnet_ids

  tags = {
    Name = "${var.app_name}-alb"
  }

  lifecycle {
    precondition {
      condition     = local.alb_subnet_b != var.subnet_id
      error_message = "ALB needs 2 subnets in different Availability Zones. Add GitHub secret AWS_SUBNET_ID_2 with a public subnet in another AZ (different from AWS_SUBNET_ID), or use a VPC that has another subnet in a different AZ."
    }
  }
}

resource "aws_lb_target_group" "app" {
  # name_prefix (<=6 chars) + create_before_destroy lets Terraform replace TG
  # (e.g. port change) without deleting the old TG while the ALB listener still points at it.
  name_prefix = "dvlbtg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = data.aws_subnet.ecs.vpc_id
  target_type = "ip"

  deregistration_delay = 10

  health_check {
    enabled             = true
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }

  tags = {
    Name = "${var.app_name}-tg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Rubric: S3 with unique name, versioning, encryption, public access blocked.
resource "aws_s3_bucket" "reports" {
  bucket = "${var.app_name}-data-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.app_name}-reports"
    Environment = "lab"
  }
}

resource "aws_s3_bucket_versioning" "reports" {
  bucket = aws_s3_bucket.reports.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "reports" {
  bucket = aws_s3_bucket.reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_ecr_repository" "app" {
  name         = var.app_name
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = var.app_name
    Environment = "lab"
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecs_cluster" "app" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {
    Name        = "${var.app_name}-cluster"
    Environment = "lab"
  }
}

resource "aws_cloudwatch_log_group" "ecs_app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 14
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.app_name}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.task_cpu)
  memory                   = tostring(var.task_memory)

  execution_role_arn = local.lab_role_arn
  task_role_arn      = local.lab_role_arn

  container_definitions = jsonencode([
    {
      name      = var.app_name
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "${var.app_name}-task"
  }
}

resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  force_new_deployment              = true
  health_check_grace_period_seconds = 180

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.app_name
    container_port   = var.container_port
  }

  network_configuration {
    subnets          = [var.subnet_id]
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  depends_on = [aws_lb_listener.http]

  tags = {
    Name        = "${var.app_name}-service"
    Environment = "lab"
  }
}

output "reports_bucket_name" {
  description = "S3 bucket for CI test reports (versioned, encrypted, private)"
  value       = aws_s3_bucket.reports.bucket
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.app.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "alb_dns_name" {
  description = "Public Application Load Balancer DNS (use this URL in browser)"
  value       = aws_lb.app.dns_name
}
