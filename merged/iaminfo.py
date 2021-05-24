from os import access
from re import I
import boto3
import json
import datetime
from datetime import date
import time
import sys
from collections import defaultdict

def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()



iam = boto3.client('iam')
iam_list = []
iamrsc = boto3.resource('iam')


for user in iam.list_users()['Users']:
 usernode = defaultdict()
 usernode['UserName'] = user['UserName']
 usernode['Userid'] = user['UserId']
 usernode['Arn'] = user['Arn']
 usernode['CreateDate'] =user['CreateDate']
 Iam_UserName=user['UserName']
 attpol = iam.list_attached_user_policies(UserName=Iam_UserName)
#  if len(attpol['AttacedPolices'])
 usernode['UserPolicy'] = attpol['AttachedPolicies'][0]['PolicyName']
 userGroups = iam.list_groups_for_user(UserName=Iam_UserName)
 if userGroups['Groups']==[]:
     usernode['GroupInfo'] = "Group Not Set"
 else:
    for group in userGroups['Groups']:
        groupnode = defaultdict()
        groupnode['GroupName']=group['GroupName']
        groupnode['GroupId']=group['GroupId']
        groupnode['GroupPolicy'] = iam.list_attached_group_policies(GroupName=group['GroupName'])['AttachedPolicies'][0]['PolicyName']
        usernode['GroupInfo'] = groupnode

 ackeys = iam.list_access_keys(UserName=Iam_UserName)
 accesskeyMetadata = ackeys['AccessKeyMetadata']
 if len(accesskeyMetadata)==0:
     usernode['AccessKeyInfo'] = "AccessKey Expiration"
 else:
     accesskeydate = accesskeyMetadata[0]['CreateDate']
     accesskeydate = accesskeydate.strftime("%Y-%m-%d %H:%M:%S")
     currentdate = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
     accesskeyd = time.mktime(datetime.datetime.strptime(accesskeydate, "%Y-%m-%d %H:%M:%S").timetuple())
     currentd = time.mktime(datetime.datetime.strptime(currentdate, "%Y-%m-%d %H:%M:%S").timetuple())
     active_days = (currentd - accesskeyd)/60/60/24
     usernode['AccessKeyInfo'] = active_days
 user = iamrsc.User(name=Iam_UserName)
 usernode['Last Login'] = user.password_last_used   #비밀번호를 통한 로그인이력(콘솔 암호 활성화 해야 나타남)


 iam_list.append(usernode)
with open('C:/Users/ssp04/Desktop/DICTPROJ/AWS-visualization/merged/json/iaminfo2.json','w',encoding="utf-8") as make_file:
    json.dump(iam_list, make_file, default=myconverter, indent="\t")