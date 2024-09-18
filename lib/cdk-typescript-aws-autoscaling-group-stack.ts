import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as dotenv from 'dotenv';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Tags } from 'aws-cdk-lib';


// Determine the environment (default to 'development' if not set)
const environment = process.env.NODE_ENV || 'development';

// Load the appropriate .env file based on the environment
dotenv.config({ path: `.env.${environment}` });

// suppress useless annoying deprectation warning
// require('aws-sdk/lib/maintenance_mode_message').suppress = true;

export class CdkTypescriptAwsAutoscalingGroupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Parse the TAGS environment variable
    const tags = JSON.parse(process.env.TAGS || '[]');

    console.log("Parsed tags:", tags); // Debugging: log the tags to verify


    // Apply the tags to the stack
    tags.forEach((tag: { key: string; value: string }) => {
      Tags.of(this).add(tag.key, tag.value);
    });

    // Get CREATE_DNS_RECORD environment variable 
    const CREATE_DNS_RECORD = process.env.CREATE_DNS_RECORD || 'false';

    // Query the environment to get the current VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
      isDefault: true,
    });

    // You can now use the 'vpc' object to access the properties of the current VPC
    console.log('Current VPC ID:', vpc.vpcId);
    console.log('Current VPC CIDR:', vpc.vpcCidrBlock);

    // Get the subnets for the current VPC
    const subnets = vpc.selectSubnets();

    // Print the subnet IDs
    subnets.subnetIds.forEach((subnetId, index) => {
      console.log(`Subnet ${index + 1} ID:`, subnetId);
    });

    // Create a security group
    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      securityGroupName: 'MySecurityGroup', // Set the security group name
    });

    // Add an ingress rule to allow world to port 443
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS access');

    // add https ingress rule
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');

    // add egress rule to allow all traffic
    securityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic(), 'Allow all traffic');

    // Create an IAM role for the EC2 instance
    const role = new iam.Role(this, 'MyInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: 'MyInstanceRole', // Set the role name
      description: 'Allows EC2 instances to call AWS services on your behalf',
    });

    // Attach an IAM policy to the role
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    // vpc endpoint for ssm
    const ssmVpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SSMVPCEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    });

    // vpc endpoint for ec2 messages  
    const ec2MessagesVpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EC2MessagesVPCEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    });

    // vpc endpoint for ssm session manager
    const ssmSessionManagerVpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SSMSessionManagerVPCEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    });

    // user data script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'dnf update -y',
      'dnf install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html',
    );


    // create the launch template
    const launchTemplate = new ec2.LaunchTemplate(this, 'MyLaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(), // Use the latest Amazon Linux 2023 image
      instanceType: new ec2.InstanceType('t2.micro'),
      userData: userData,
      securityGroup: securityGroup,
      role: role,
      associatePublicIpAddress: true,
    });

    // create the auto scaling group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'MyAutoScalingGroup', {
      vpc,
      vpcSubnets: subnets,
      launchTemplate,
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 1,
    });

    // create load balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'MyLoadBalancer', {
      vpc,
      internetFacing: true,
    });

    // target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'MyTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
    });

    if (CREATE_DNS_RECORD === 'true') {

      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'MyHostedZone', {
        hostedZoneId: process.env.HOSTED_ZONE_ID || '',
        zoneName: process.env.ZONE_NAME || '',
      });

      // certificate 
      const cert = new acm.Certificate(this, 'MyCertificate', {
        domainName: process.env.DNS_NAME || '',
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });

      // DNS entry
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(loadBalancer)),
        recordName: process.env.DNS_NAME || '',
      });

      // create the listener
      const listener = loadBalancer.addListener('MyListener ', {
        port: 443,
        open: true,
        certificates: [cert],
      });

      // listener redirect from port 80 to 443
      loadBalancer.addListener('RedirectListener', {
        port: 80,
        open: true,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });

      // add the target group to the listener
      listener.addTargetGroups('MyTargetGroup', {
        targetGroups: [targetGroup],
      });

      // add the target group to the listener
      listener.addTargetGroups('MyTargetGroup', {
        targetGroups: [targetGroup],
      });

      // add the auto scaling group to the target group
      targetGroup.addTarget(autoScalingGroup);

      // add the auto scaling group to the load balancer
      listener.addTargets('MyTarget', {
        port: 80,
        targets: [autoScalingGroup],
      });

    } else {

      // create the listener
      const listener = loadBalancer.addListener('MyListener ', {
        port: 80,
        open: true,
      });

      // add the target group to the listener
      listener.addTargetGroups('MyTargetGroup', {
        targetGroups: [targetGroup],
      });

      // add the target group to the listener
      listener.addTargetGroups('MyTargetGroup', {
        targetGroups: [targetGroup],
      });

      // add the auto scaling group to the target group
      targetGroup.addTarget(autoScalingGroup);

      // add the auto scaling group to the load balancer
      listener.addTargets('MyTarget', {
        port: 80,
        targets: [autoScalingGroup],
      });

    }

    // output the load balancer DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
    });

    // output the load balancer ARN
    new cdk.CfnOutput(this, 'LoadBalancerARN', {
      value: loadBalancer.loadBalancerArn,
    });

    // output the target group ARN
    new cdk.CfnOutput(this, 'TargetGroupARN', {
      value: targetGroup.targetGroupArn,
    });

    // output the auto scaling group ARN
    new cdk.CfnOutput(this, 'AutoScalingGroupARN', {
      value: autoScalingGroup.autoScalingGroupArn,
    });

    // output the auto scaling group name
    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
    });


  }
}