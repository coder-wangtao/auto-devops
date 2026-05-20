#!/bin/bash
#function:轮转切割nginx的访问日志,日志文件统一成(域名.access.log)
#author: sys 2020-01-01
base_path=/usr/local/nginx/logs
day=$(date -d yesterday +"%Y%m%d")
for file in `ls $base_path/*.access.log`
do
        mv $base_path/$file $base_path/${file}_${day}
done
service   nginx   restart
find $base_path -type f -name "*.access.log_20*" -mtime +3 -exec rm -f {} \;