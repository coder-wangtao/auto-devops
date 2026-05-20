#!/bin/bash
#function:对web日志进行压缩处理(在nginx上还包括改名和日志切割操作)，进行远程备份,三天前的数据会被删除,适用于apache和nginx
#在apache上日志格式统一为20120214_access_my.xxxx.com_log;nginx上的日志格式统一为access_my.xxxx.com_log
#author:xxxx system group
#time:20200214


#########################################################注意点#############################################
#此脚本要在00：00或23：59执行
#做日志处理需要修改的部份:
#1.日志的路径要正确
#2.rsync的密码文件要生成一份 /etc/59.pas   这个文件 权限为600   内容为0110
#3.在172.20.1.59上要先建目录  mkdir -p /html/"$localip"/weblog
#4.日志格式一定要正确,不正确修改配置文件
#5.localip要正确
#############################################################################################################

PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
#定义web服务器的各个参数变量

#定义本机内网IP
export localip=172.20.1.170
#web日志的存放路径
export WEBLOGS_PATH=/usr/local/nginx/logs
#export WEBLOGS_PATH=/usr/local/apache2/logs
#远程备份服务器IP和远程备份路径
export rsync_host=172.20.1.59
export rsync_d=html/"$localip"/weblog
#脚本运行过程中记录的日志路径和文件名
export shlog_path=/usr/local/scripts/weblog
export shlog_file="$shlog_path"/weblog`date +"%Y%m%d"`.log
#定义本地web日志的保存时间,单位为天
export expireday=3
 

#判断指定的ip是否正确
function istrueip()
{
	num=`/sbin/ifconfig |grep $localip |wc -l`	
	log "-----$num"
	if [ $num -eq "1" ];then
		echo "ip is  true"
	else
		log "localip is not true,weblog.sh run failed!"
		exit 2000
	fi
}

#处理过程中产生的日志由日志函数来进行处理记录
function log()
{
	echo "`date +"%Y:%m:%d %H-%M-%S"` $1 "	>> $shlog_file
}




#删除过期的日志文件，包括脚本日志和web日志
function  rmexpire()
{
	
	find  $WEBLOGS_PATH  -name  "*access_*_log.gz" -type f -mtime +"$expireday" -exec rm -rvf  {}  \;	 
	find  $WEBLOGS_PATH  -name  "*access_*_log" -type f -mtime +"$expireday" -exec rm -rvf  {}  \;	 
	find  $shlog_path  -name  "weblog*.log" -type f -mtime +30 -exec rm -rvf  {}  \;	 
	
}




#将数据传输到远程备份服务器中
function transfer() 
{
	
	 /usr/bin/rsync -avzu  --password-file=/etc/59.pas --progress  $1  partner@$rsync_host::$rsync_d >>$shlog_file	 2>&1
}



#将nginx的日志文件进行改名操作,apache的日志虽有调用该函数但不会进行改名操作
function mvfile()
{
	yesterday=`date -d "yesterday" +"%Y%m%d"`
	#num=`echo "$1" |cut -d "_"  -f 3 |wc  -l`
	#if [ $num -ne "8" ];then
	mv $1  "$yesterday"_"$1"
	kill -USR1 `cat /var/run/nginx.pid`
	#fi
}


#调用前面的各个函数，对日志进行备份处理，如下是主程序处理过程
if [ ! -d $shlog_path ];then
	mkdir  -p $shlog_path	
fi
istrueip
cd $WEBLOGS_PATH
for file in `ls access_*_log`
do
	mvfile $file
	log "$file 改名操作 "
done

for file in `ls *_access_*_log`
do
	gzip -6 $file
	log "$file 压缩操作 "
	transfer $file.gz 
	log "$file 传输操作 "
done
rmexpire


