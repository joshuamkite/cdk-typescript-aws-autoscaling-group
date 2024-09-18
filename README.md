# CDK TypeScript AWS AutoScaling Group

- [CDK TypeScript AWS AutoScaling Group](#cdk-typescript-aws-autoscaling-group)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
    - [Step 1: Initialize Your AWS Profile](#step-1-initialize-your-aws-profile)
    - [Step 2: Clone the Repository](#step-2-clone-the-repository)
    - [Step 3: Configure Account ID and Region](#step-3-configure-account-id-and-region)
    - [Step 4: Set Up Environment Variables](#step-4-set-up-environment-variables)
    - [Step 5: Deployment](#step-5-deployment)
      - [Set AWS Profile](#set-aws-profile)
      - [Build and Synthesize (Optional)](#build-and-synthesize-optional)
      - [Deploy the Stack](#deploy-the-stack)
    - [Step 6: Destroy the Stack](#step-6-destroy-the-stack)
  - [How This Was Built](#how-this-was-built)
  - [Additional Notes](#additional-notes)
  - [Useful commands](#useful-commands)


This project is an AWS CDK (Cloud Development Kit) stack written in TypeScript that deploys an AutoScaling group, load balancer, and optionally a Route53 DNS record. It uses environment variables for configuration and requires manual setup for account-specific details.

## Prerequisites

Before using this project, ensure you have the following installed:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [Node.js](https://nodejs.org/en/download/) (version 14.x or higher)
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) (installed globally)

Install AWS CDK globally:

```bash
npm install -g aws-cdk
```

## Setup

### Step 1: Initialize Your AWS Profile

Ensure your AWS CLI is configured with the appropriate AWS credentials:

```bash
aws configure --profile <your-aws-profile>
```

### Step 2: Clone the Repository

Clone this repository and install the dependencies:

```bash
git clone <repository-url>
cd cdk-typescript-aws-autoscaling-group
npm install
```

### Step 3: Configure Account ID and Region

Edit the `bin/cdk-typescript-aws-autoscaling-group.ts` file and replace the placeholders for your AWS account ID and region:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkTypescriptAwsAutoscalingGroupStack } from '../lib/cdk-typescript-aws-autoscaling-group-stack';

const app = new cdk.App();
new CdkTypescriptAwsAutoscalingGroupStack(app, 'CdkTypescriptAwsAutoscalingGroupStack', {
  env: {
    account: '<your-account-id>',
    region: '<your-region>',
  },
});
```

### Step 4: Set Up Environment Variables

To configure environment-specific settings, you'll need to create and fill out the appropriate `.env` files.

1. **Default `.env.dns` for DNS configurations:**

   If you want to enable Route53 DNS record creation, create the `.env.dns` file with the following structure:

   ```plaintext
   TAGS='[{"key": "Name", "value": "cdk-demo"}, {"key": "environment", "value": "production"}]'
   CREATE_DNS_RECORD=true
   DNS_NAME="your-dns-name.example.com"
   HOSTED_ZONE_ID="your-hosted-zone-id"
   ZONE_NAME="your-zone-name.example.com"
   ```

2. **Default `.env.notdns` for configurations without DNS:**

   You can also use `.env.notdns` if you don't want to create Route53 DNS records, TLS certificate etc.:

   ```plaintext
   TAGS='[{"key": "Name", "value": "cdk-demo"}, {"key": "environment", "value": "development"}]'
   CREATE_DNS_RECORD=false
   ```
   
### Step 5: Deployment

#### Set AWS Profile

Before running any CDK commands, make sure you set your AWS profile:

```bash
export AWS_PROFILE=<your-aws-profile>
```

#### Build and Synthesize (Optional)

You should be in the project's root directory to build and synthesize the CDK app:

```bash
npm run build
NODE_ENV=notdns cdk synth
NODE_ENV=dns cdk synth
```

#### Deploy the Stack

To deploy the stack to your AWS account:

```bash
NODE_ENV=notdns cdk deploy
NODE_ENV=dns cdk deploy
```

This will deploy your resources, including AutoScaling groups, security groups, load balancers, and (optionally) DNS records if the `.env.dns` file is configured.

### Step 6: Destroy the Stack

To tear down all the resources created by this stack:

```bash
NODE_ENV=notdns cdk destroy
NODE_ENV=dns cdk destroy
```

## How This Was Built

To initialize this CDK project in TypeScript:

```bash
cdk init app --language typescript
```

The main stack is in:

```
lib/cdk-typescript-aws-autoscaling-group-stack.ts
```

## Additional Notes

- Make sure to add your `.env` files and any other sensitive data to `.gitignore` to avoid exposing credentials or configuration data in your repository.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
