variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "ECR repo name and app prefix (must match workflow APP_NAME)"
  type        = string
  default     = "devops-lab-app"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

variable "subnet_id" {
  description = "Subnet ID from your VPC (AWS Academy / lab)"
  type        = string

  validation {
    condition     = can(regex("^subnet-[a-z0-9]+$", var.subnet_id))
    error_message = "subnet_id must look like subnet-xxxxxxxx."
  }
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks (must allow inbound TCP on container_port)"
  type        = string

  validation {
    condition     = can(regex("^sg-[a-z0-9]+$", var.security_group_id))
    error_message = "security_group_id must look like sg-xxxxxxxx."
  }
}

variable "task_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate task memory (MiB)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "ECS tasks (0 until CI pushes image, then workflow sets desired count to 1)"
  type        = number
  default     = 0
}
