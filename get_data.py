import boto3
import json
import datetime
from collections import defaultdict


def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()

session = boto3.Session(profile_name='capstone')

def get_infra():
    ec2 = session.resource('ec2')

    vpc_idx = 0
    subnet_idx = 0
    inst_idx = 0
    nat_idx = 0
    igw_idx = 0

    radius = {
        'h1': 5, # vpc
        'h2': 4, # subnet, igw
        'h3': 3, # inst
        'null': 0.01, # rds, s3, elb,
    }

    # hierarchy data + link data
    graph = {
        'links': [],
        'root': None
    }

    root_node = {
        'id': 'root',
        'name': 'root',
        'children': [],
    }

    null_node = {
        'id': 'null',
        'name': 'null',
        'children': [],
        'size': radius['null']
    }

    internet_gateways = ec2.internet_gateways
    route_tables = ec2.route_tables
    subnets = ec2.subnets
    volumes = ec2.volumes
    vpcs = ec2.vpcs.all()

    elb_list = session.client('elb').describe_load_balancers()['LoadBalancerDescriptions']
    nat_list = session.client('ec2').describe_nat_gateways()['NatGateways']

    rds_list = []
    resp_rds = session.client('rds').describe_db_instances()
    for rds in resp_rds['DBInstances']:
        rds_idx = 0
        for sub in rds['DBSubnetGroup']['Subnets']:
            rds_node = defaultdict()
            rds_node['id'] = rds['DbiResourceId'] + '@' + str(rds_idx)
            rds_node['href'] = 'icons/aws_rds.png'
            rds_node['engine'] = rds['Engine']
            rds_node['endpoint'] = rds['Endpoint']  # includes DNS address of thd DB instance
            rds_node['create_time'] = rds['InstanceCreateTime']
            rds_node['az'] = rds['AvailabilityZone']
            rds_node['vpc_id'] = rds['DBSubnetGroup']['VpcId']
            rds_node['subnet_id'] = sub['SubnetIdentifier']
            rds_node['children'] = [null_node]
            rds_list.append(rds_node)
            rds_idx += 1

        for i in range(rds_idx - 1):
            graph['links'].append({'source': rds['DbiResourceId'] + '@' + str(i),
                                   'target': rds['DbiResourceId'] + '@' + str(i + 1)})

    resp_s3 = session.client('s3').list_buckets()
    for bucket in resp_s3['Buckets']:
        bucket_node = defaultdict()
        bucket_node['id'] = 's3-' + bucket['Name']
        bucket_node['name'] = bucket['Name']
        bucket_node['href'] = 'icons/aws_s3.png'
        bucket_node['CreationDate'] = myconverter(bucket['CreationDate'])
        bucket_node['children'] = [null_node]
        root_node['children'].append(bucket_node)

    for vpc in vpcs:
        vpc_node = defaultdict()
        vpc_node['id'] = vpc.vpc_id
        vpc_node['name'] = 'vpc-' + str(vpc_idx)
        vpc_node['size'] = radius['h1']
        vpc_node['state'] = vpc.state
        vpc_node['cidr_block'] = vpc.cidr_block
        vpc_node['href'] = 'icons/aws_vpc.png'
        vpc_node['children'] = [null_node]

        resp_elb = list(filter(lambda e: e['VPCId'] == vpc_node['id'], elb_list))
        for elb in resp_elb:
            elb_node = defaultdict()
            elb_node['id'] = 'elb-' + vpc_node['id']
            elb_node['name'] = 'elb-' + elb['LoadBalancerName']
            elb_node['href'] = 'icons/aws_elb.png'
            elb_node['dns_name'] = elb['DNSName']
            elb_node['policies'] = elb['Policies']
            elb_node['azs'] = elb['AvailabilityZones']
            elb_node['subnet_ids'] = elb['Subnets']
            elb_node['vpc_id'] = elb['VPCId']
            elb_node['owner_alias'] = elb['SourceSecurityGroup']['OwnerAlias']
            elb_node['group_name'] = elb['SourceSecurityGroup']['GroupName']
            elb_node['created_time'] = myconverter(elb['CreatedTime'])
            elb_node['scheme'] = elb['Scheme']
            elb_node['children'] = [null_node]
            vpc_node['children'].append(elb_node)

            for inst in elb['Instances']:
                graph['links'].append({'source': elb_node['id'], 'target': inst['InstanceId']})

        resp_igw = internet_gateways.filter(
            Filters=[
                {
                    'Name': 'attachment.vpc-id',
                    'Values': [
                        vpc_node['id']
                    ]
                }
            ]
        )
        for igw in resp_igw:
            igw_node = defaultdict()
            igw_node['id'] = igw.internet_gateway_id
            igw_node['name'] = 'igw-' + str(vpc_idx) + str(igw_idx)
            igw_node['owner_id'] = igw.owner_id
            igw_node['size'] = radius['h2']
            igw_node['href'] = 'icons/aws_igw.png'
            igw_node['children'] = [null_node]
            vpc_node['children'].append(igw_node)

        resp_subnet = subnets.filter(
            Filters=[
                {
                    'Name': 'vpc-id',
                    'Values': [
                        vpc_node['id']
                    ]
                }
            ]
        )
        for subnet in resp_subnet:
            subnet_node = defaultdict()
            subnet_node['id'] = subnet.subnet_id
            subnet_node['name'] = 'subnet-' + str(vpc_idx) + str(subnet_idx)
            subnet_node['size'] = radius['h2']
            subnet_node['az'] = subnet.availability_zone
            subnet_node['cidr_block'] = subnet.cidr_block
            subnet_node['state'] = subnet.state
            subnet_node['children'] = [null_node]

            resp_nat = list(filter(lambda e: e['VpcId'] == vpc_node['id'] and e['SubnetId'] == subnet_node['id'],
                               nat_list))

            for nat in resp_nat:
                nat_node = defaultdict()
                nat_node['id'] = nat['NatGatewayId']
                nat_node['name'] = 'nat-' + str(vpc_idx) + str(subnet_idx) + str(nat_idx)
                nat_node['href'] = 'icons/aws_nat.png'
                nat_node['state'] = nat['State']
                nat_node['public_ip'] = nat['NatGatewayAddresses'][0]['PublicIp']
                nat_node['private_ip'] = nat['NatGatewayAddresses'][0]['PrivateIp']
                nat_node['create_time'] = nat['CreateTime']
                nat_node['subnet_id'] = nat['SubnetId']
                nat_node['vpc_id'] = nat['VpcId']
                nat_node['children'] = [null_node]
                subnet_node['children'].append(nat_node)
                nat_idx += 1
            nat_idx = 0

            resp_route_table = route_tables.filter(
                Filters=[
                    {
                        'Name': 'vpc-id',
                        'Values': [
                            vpc_node['id']
                        ]
                    },
                    {
                        'Name': 'association.subnet-id',
                        'Values': [
                            subnet_node['id']
                        ]
                    },
                ]
            )
            resp_route_table = list(resp_route_table)
            subnet_node['route_table'] = []
            if len(resp_route_table):
                routes = resp_route_table[0].routes_attribute

                for route in routes:
                    entry = defaultdict()
                    entry['destination_cidr_block'] = route['DestinationCidrBlock']
                    entry['state'] = route['State']

                    if entry['destination_cidr_block'] == '0.0.0.0/0':
                        if 'NatGatewayId' in route:
                            entry['nat_gateway_id'] = route['NatGatewayId']
                            subnet_node['type'] = 'private'
                            graph['links'].append({'source': route['NatGatewayId'], 'target': subnet_node['id']})
                        elif 'GatewayId' in route and 'igw-' in route['GatewayId']:
                            entry['gateway_id'] = route['GatewayId']
                            subnet_node['type'] = 'public'
                            graph['links'].append({'source': route['GatewayId'], 'target': subnet_node['id']})
                        elif 'InstanceId' in route:
                            entry['instance_id'] = route['InstanceId']
                            subnet_node['type'] = 'private'
                            graph['links'].append({'source': route['InstanceId'], 'target': subnet_node['id']})
                        elif 'NetworkInterfaceId' in route:
                            entry['network_interface_id'] = route['NetworkInterfaceId']
                            subnet_node['type'] = 'blackhole'
                    else:
                        entry['gateway_id'] = route['GatewayId'] #local

                    subnet_node['route_table'].append(entry)

            else:
                subnet_node['type'] = 'empty'
            subnet_node['href'] = 'icons/aws_' + subnet_node['type'] + '_subnet.png'

            resp_rds = list(filter(lambda e: e['vpc_id'] == vpc_node['id'] and e['subnet_id'] == subnet_node['id'], \
                                   rds_list))

            for rds_node in resp_rds:
                rds_node['name'] = 'rds-' + str(vpc_idx) + str(subnet_idx)
                subnet_node['children'].append(rds_node)

            for inst in subnet.instances.all():
                inst_node = defaultdict()
                inst_node['id'] = inst.instance_id
                inst_node['name'] = 'inst-' + str(vpc_idx) + str(subnet_idx) + str(inst_idx)
                inst_node['size'] = radius['h3']
                inst_node['href'] = 'icons/aws_ec2.png'
                inst_node['type'] = inst.instance_type
                inst_node['launch_time'] = inst.launch_time
                inst_node['state'] = inst.state['Name']
                inst_node['core_count'] = inst.cpu_options['CoreCount']
                inst_node['threads_per_core'] = inst.cpu_options['ThreadsPerCore']
                inst_node['public_ip_address'] = inst.public_ip_address
                inst_node['public_dns_name'] = inst.public_dns_name
                inst_node['private_ip_address'] = inst.private_ip_address
                inst_node['private_dns_name'] = inst.private_dns_name
                inst_node['ami_id'] = inst.image_id

                resp_vol = volumes.filter(
                    Filters=[
                        {
                            'Name': 'attachment.instance-id',
                            'Values': [
                                inst_node['id']
                            ]
                        }
                    ]
                )
                resp_vol = list(resp_vol)
                inst_node['volume_id'] = resp_vol[0].volume_id
                inst_node['volume_size'] = resp_vol[0].size
                inst_node['volume_type'] = resp_vol[0].volume_type

                inst_node['children'] = [null_node]
                subnet_node['children'].append(inst_node)
                inst_idx += 1
            inst_idx = 0

            vpc_node['children'].append(subnet_node)
            subnet_idx += 1
        subnet_idx = 0

        root_node['children'].append(vpc_node)
        vpc_idx += 1

    graph['root'] = root_node

    with open("json/packed_circle.json", "w") as json_file:
        json.dump(graph, json_file, default=myconverter, indent=4)
        json_file.close()

    return graph

def get_iam():
    iam = session.resource('iam')

    graph = defaultdict()

    root_node = {
        'user_name': 'root',
        'children': []
    }

    groups = iam.groups.all()

    for group in groups:
        group_node = defaultdict()
        group_node['group_id'] = group.group_id
        group_node['group_name'] = group.group_name
        group_node['group_attached_policies'] = [e.policy_name for e in list(group.attached_policies.all())]
        group_node['children'] = []

        users = group.users.all()
        for user in users:
            user_node = defaultdict()
            user_node['user_id'] = user.user_id
            user_node['user_name'] = user.user_name
            user_node['user_arn'] = user.arn
            user_node['user_create_date'] = user.create_date
            user_node['user_password_last_used'] = user.password_last_used
            user_node['user_attached_policies'] = [e.policy_name for e in list(user.attached_policies.all())]
            group_node['children'].append(user_node)

        root_node['children'].append(group_node)

    graph['tree'] = root_node

    # with open("json/packed_circle.json", "w") as json_file:
    #     json.dump(graph, json_file, default=myconverter, indent=4)
    #     json_file.close()

    return graph
