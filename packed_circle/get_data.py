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
    vpc_node['id'] = vpc.vpc_id
    vpc_node['state'] = vpc.state
    vpc_node['cidr_block'] = vpc.cidr_block
    vpc_node['name'] = 'vpc_' + str(vpc_idx)
    vpc_node['size'] = radius['layer_1']
    vpc_node['href'] = 'icons/aws_igw.png'
    vpc_node['children'] = []
    vpc_node['children'].append(null_node(radius['layer_2']))

    vpc_node['Igws'] = []
    igws = vpc.internet_gateways.all()
    for igw in igws:
        igw_node = defaultdict()
        igw_node['id'] = igw.internet_gateway_id
        igw_node['attachments'] = ec2.InternetGateway(igw_node['id']).attachments
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
        subnet_node['id'] = subnet.subnet_id
        subnet_node['az'] = subnet.availability_zone
        subnet_node['cidr_block'] = subnet.cidr_block
        subnet_node['state'] = subnet.state
        subnet_node['Natgws'] = client.describe_nat_gateways(
            Filters=[
                {
                    'Name': 'vpc-id',
                    'Values': [
                        vpc_node['id']
                    ]
                },
                {
                    'Name': 'subnet-id',
                    'Values': [
                        subnet_node['id']
                    ]
                }
            ]
        )['NatGateways']
        response = client.describe_route_tables(
            Filters=[
                {
                    'Name': 'association.subnet-id',
                    'Values': [
                        subnet_node['id']
                    ]
                }
            ]
        )
        if len(response['RouteTables']):
            subnet_node['RouteTable'] = response['RouteTables'][0]['Routes']
        else:
            subnet_node['RouteTable'] = []
        subnet_node['name'] = 'subnet_' + str(vpc_idx) + str(subnet_idx)
        subnet_node['size'] = radius['layer_2']
        subnet_node['href'] = 'icons/aws_route_table.png'
        subnet_node['children'] = []
        subnet_node['children'].append(null_node(radius['layer_3']))

        instances = subnet.instances.all()
        for inst in instances:
            inst_node = defaultdict()
            inst_node['id'] = inst.instance_id
            inst_node['type'] = inst.instance_type
            inst_node['launch_time'] = inst.launch_time
            inst_node['state'] = inst.state
            inst_node['public_ip_address'] = inst.public_ip_address
            inst_node['public_dns_name'] = inst.public_dns_name
            inst_node['private_ip_address'] = inst.private_ip_address
            inst_node['private_dns_name'] = inst.private_dns_name
            inst_node['ami_id'] = inst.image_id

            inst_node['Security_groups'] = inst.security_groups
            for g in inst_node['Security_groups']:
                response = ec2.SecurityGroup(g['GroupId'])
                g['Inbound'] = response.ip_permissions
                g['Outbound'] = response.ip_permissions_egress

            inst_node['root_volume'] = defaultdict()
            response = client.describe_instance_attribute(InstanceId=inst_node['id'],
                                                          Attribute='blockDeviceMapping')
            volume = ec2.Volume(response['BlockDeviceMappings'][0]['Ebs']['VolumeId'])
            inst_node['root_volume']['id'] = volume.attachments[0]['VolumeId']
            inst_node['root_volume']['name'] = volume.attachments[0]['Device']
            inst_node['root_volume']['state'] = volume.attachments[0]['State']
            inst_node['root_volume']['attach_time'] = volume.attachments[0]['AttachTime']
            inst_node['root_volume']['size'] = volume.size
            inst_node['root_volume']['type'] = volume.volume_type
            inst_node['root_volume']['throughput'] = volume.throughput

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


with open("C:/Users/ssp04/Desktop/Circle_Packing/packed_circle/json/packed_circle.json", "w") as json_file:
    json.dump(root_node, json_file, default=myconverter, indent=4)
    json_file.close()
