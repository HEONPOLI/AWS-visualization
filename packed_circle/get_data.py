import boto3
import json
import datetime
from collections import defaultdict


def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()


def null_node(r):
    node = defaultdict()
    node['name'] = 'null'
    node['children'] = []
    node['size'] = r / 10

    return node


data = defaultdict()
ec2 = boto3.resource('ec2')
client = boto3.client('ec2')

radius = defaultdict()
# vpc
radius['layer_1'] = 50
# subnet, igw
radius['layer_2'] = 40
# inst
radius['layer_3'] = 30

radius['layer_4'] = 20

vpc_idx = 0
subnet_idx = 0
inst_idx = 0
nat_idx = 0
igw_idx = 0

root_node = defaultdict()
root_node['name'] = 'root'
root_node['href'] = 'icons/aws_root.png'
root_node['children'] = []
root_node['children'].append(null_node(radius['layer_1']))

vpcs = ec2.vpcs.all()
for vpc in vpcs:
    vpc_node = defaultdict()
    vpc_node['name'] = 'vpc_' + str(vpc_idx)
    vpc_node['size'] = radius['layer_1']
    vpc_node['href'] = 'icons/aws_vpc.png'
    vpc_node['children'] = []
    vpc_node['children'].append(null_node(radius['layer_2']))

    igws = vpc.internet_gateways.all()
    for igw in igws:
        igw_node = defaultdict()
        igw_node['name'] = 'igw_' + str(vpc_idx) + str(igw_idx)
        igw_node['size'] = radius['layer_2']
        igw_node['href'] = 'icons/aws_igw.png'
        igw_node['children'] = []
        igw_node['children'].append(null_node(radius['layer_3']))
        # vpc_node['children'].append(igw_node)
        igw_idx += 1
    igw_idx = 0

    subnets = vpc.subnets.all()
    for subnet in subnets:
        subnet_node = defaultdict()
        subnet_node['name'] = 'subnet_' + str(vpc_idx) + str(subnet_idx)
        subnet_node['size'] = radius['layer_2']
        subnet_node['href'] = 'icons/aws_router.png'
        subnet_node['children'] = []
        subnet_node['children'].append(null_node(radius['layer_3']))

        instances = subnet.instances.all()
        for inst in instances:
            inst_node = defaultdict()
            inst_node['name'] = 'inst_' + str(vpc_idx) + str(subnet_idx) + str(inst_idx)
            inst_node['size'] = radius['layer_3']
            inst_node['href'] = 'icons/aws_ec2.png'
            inst_node['children'] = []
            inst_node['children'].append(null_node(radius['layer_4']))
            subnet_node['children'].append(inst_node)
            inst_idx += 1
        inst_idx = 0

        vpc_node['children'].append(subnet_node)
        subnet_idx += 1
    subnet_idx = 0

    root_node['children'].append(vpc_node)
    vpc_idx += 1
vpc_idx = 0


with open("json/packed_circles.json", "w") as json_file:
    # json.dump(data, json_file, default=myconverter)
    json.dump(root_node, json_file, default=myconverter)