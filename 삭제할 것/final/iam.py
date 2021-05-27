import boto3
import json
import datetime
from collections import defaultdict
import time


def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()


def get_iam():
    session = boto3.Session(profile_name='capstone')
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

    with open("json/scratchNote.json", "w") as json_file:
        json.dump(graph, json_file, default=myconverter, indent=4)
        json_file.close()


if __name__ == '__main__':
    start = time.time()
    get_iam()
    print(time.time() - start)
