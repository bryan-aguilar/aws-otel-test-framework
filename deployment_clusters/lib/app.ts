#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClusterManagementStack } from './stacks/cluster-management-stack';
import { readFileSync} from 'fs';
import { ClusterResourceStack } from './stacks/clusterResourcestack';
import { validateClusters } from './utils/parse';
import { VPCStack } from './utils/vpc-stack';
import { Stack, StackProps, aws_eks as eks, aws_ec2 as ec2} from 'aws-cdk-lib';
import { ClusterStack } from './stacks/cluster-stack';
import { AwsAuth } from 'aws-cdk-lib/aws-eks';
import { Role } from 'aws-cdk-lib/aws-iam';
const yaml = require('js-yaml')







const app = new cdk.App();

const REGION = 'us-west-2'

const clusterMap = new Map<string, ClusterStack>();

const vs = new VPCStack(app, "EKSVpc", {
  env: {
    region: REGION
  }
})


// console.log(process.env.CDK_CONFIG_PATH)
const route = process.env.CDK_CONFIG_PATH ||  __dirname + '/config/clusters.yml';
// const route =  __dirname + '/config/clusters.yml';
const raw = readFileSync(route)
const data = yaml.load(raw)



validateClusters(data)
// const bigMap = parseData(data['clusters'])
for(const [key, value] of Object.entries(data['clusters'])){
  const val = Object(value)
  const versionKubernetes = eks.KubernetesVersion.of(String(val['version']));
  const newStack = new ClusterStack(app, key + "Stack", {
    launch_type: String(val['launch_type']),
    name: key,
    vpc: vs.vpc,
    version: versionKubernetes,
    cpu: String(val["cpu_architecture"]),
    node_size: String(val["node_size"]),
    env: {
      region: REGION
    },
  })
    if(process.env.CDK_EKS_RESOURCE_DEPLOY == 'true'){
        const crs = new ClusterResourceStack(app, key+"-resource",{
            clusterStack: newStack,
            env: {
                region: REGION
            }
        })
        crs.addDependency(newStack)
    }
    

  clusterMap.set(key, newStack)
}




// if(process.env.CDK_EKS_RESOURCE_DEPLOY){

//     for(const key in clusterMap.keys()){
//         const cms = clusterMap.get(key)
//         if(cms === undefined){
//             continue
//         }
//         const crs = new ClusterResourceStack(app,cms.cluster.clusterName + "-resource",{
//             clusterStack: cms
//         })
//         crs.addDependency(cms)
//     }
//     // const crs = new ClusterResourceStack(app,"eks-cluster-resource",{
//     //     clusterManagementStack:cms
//     // })
//     // crs.addDependency(cms)
// }

function getCluster(clusterName: string) : eks.ICluster | undefined {
    return clusterMap.get(clusterName)?.cluster
  }





// const route = __dirname + '/config/clusters.yml';
// const raw = readFileSync(route)
// const data = yaml.load(raw)
// const app = new cdk.App();


// const cms = new ClusterManagementStack(app, 'ClusterManagementStack', {
//     data: data,
//     env: {
//         region: 'us-west-2'
//     },
// });

