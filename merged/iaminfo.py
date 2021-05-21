from re import I
import boto3
import json
import datetime
from collections import defaultdict

def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()



iam = boto3.client('iam')
iam_list = []

for user in iam.list_users()['Users']:
 usernode = defaultdict()
 usernode['UserName'] = user['UserName']
 usernode['Userid'] = user['UserId']
 usernode['Arn'] = user['Arn']
 usernode['CreateDate'] =user['CreateDate']
 userGroups = iam.list_groups_for_user(UserName=user['UserName'])
 usernode['Policy'] = iam.list_user_policies(UserName=user['UserName'])['PolicyNames']
 for group in userGroups['Groups']:
     groupnode = defaultdict()
     groupnode['GroupName']=group['GroupName']
     groupnode['GroupId']=group['GroupId']
     usernode['GroupInfo'] =groupnode
 iam_list.append(usernode)

 #print(usernode)
 #print(iam_idx)

#print(iam_list)

with open('AWS-visualization/merged/json/iaminfo2.json','w',encoding="utf-8") as make_file:
    json.dump(iam_list, make_file, default=myconverter, indent="\t")