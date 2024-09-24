# CDK TypeScript AWS AutoScaling Group

- [CDK TypeScript AWS AutoScaling Group](#cdk-typescript-aws-autoscaling-group)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
    - [Install the dependencies:](#install-the-dependencies)
    - [Set Up Environment Variables](#set-up-environment-variables)
    - [Deployment](#deployment)
      - [Build and Synthesize (Optional)](#build-and-synthesize-optional)
      - [Deploy the Stack](#deploy-the-stack)
    - [Destroy the Stack](#destroy-the-stack)
  - [How This Was Built](#how-this-was-built)
  - [Additional Notes](#additional-notes)
  - [Useful commands](#useful-commands)


This project is an AWS CDK (Cloud Development Kit) stack written in TypeScript that deploys an AutoScaling group, load balancer, and optionally a Route53 DNS record. Serves 'Hello World' webpage. It uses environment variables for configuration and requires manual setup for account-specific details.

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

### Install the dependencies:

```bash
npm install
```

### Set Up Environment Variables

To configure environment-specific settings, you'll need to create and fill out the appropriate `.env` files.

1. **Default `.env.dns` for DNS configurations:**

   If you want to enable Route53 DNS record creation, the `.env.dns` file has the following structure:

   ```plaintext
   TAGS='[{"key": "Name", "value": "cdk-demo"}, {"key": "environment", "value": "production"}]'
   CREATE_DNS_RECORD=true
   ```

2. **Default `.env.notdns` for configurations without DNS:**

   You can also use `.env.notdns` if you don't want to create Route53 DNS records, TLS certificate etc.:

   ```plaintext
   TAGS='[{"key": "Name", "value": "cdk-demo"}, {"key": "environment", "value": "development"}]'
   CREATE_DNS_RECORD=false
   ```

I find it simpler to export environment variables directly for the common parts, e.g. `source .env.common` where `.env.common` is like:

```bash
export CDK_DEFAULT_ACCOUNT=
export CDK_DEFAULT_REGION=
export AWS_PROFILE=
export AWS_REGION=
export DNS_NAME="" # Only required if CREATE_DNS_RECORD=true
export HOSTED_ZONE_ID='' # Only required if CREATE_DNS_RECORD=true
export ZONE_NAME='' # Only required if CREATE_DNS_RECORD=true
```
 
### Deployment

#### Build and Synthesize (Optional)

You should be in the project's root directory to build and synthesize the CDK app:

```bash
npm run build
cdk synth
```

#### Deploy the Stack

To deploy the stack to your AWS account:

```bash
   cdk deploy
```

This will deploy your resources, including AutoScaling groups, security groups, load balancers, and (optionally) DNS records if the `.env.dns` file is configured.

### Destroy the Stack

To tear down all the resources created by this stack:

```bash
   cdk destroy
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
