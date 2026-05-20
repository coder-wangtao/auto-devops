crontab周期性任务

1、crontab服务管理

​	1）服务管理命令

​     service  crond  {start|stop|status|reload|restart}    //老的方式

​     systemctl restart/start/stop/status/reload  crond.service

​	2）常用命令

​	crontab -u //设定某个用户的cron服务，一般root用户在执行这个命令的时候需要此参数

​	crontab -l //列出某个用户cron服务的详细内容

​	crontab -r //删除某个用户的cron服务

​    crontab -e //编辑某个用户的cron服务系统存储

   周期性任务格式（最小周期是每分钟）：

​         第1列表示分钟1～59 每分钟用*或者 */1表示

​         第2列表示小时1～23（0表示0点）

​         第3列表示日期1～31

​         第4列表示月份1～12 

​         第5列标识号星期0～7（0和7表示星期天）

​         第6列要运行的命令

​    3）allow和deny

​	哪些人可以使用crontab  

​	/etc/cron.allow  ，在里头的用户被允许，不在的被拒绝

​	/etc//cron.deny，在里头的用户被拒绝，不在的被允许

​	allow的优先级比deny来的高，在系统中只要有一个文件存在即可

​	两个都不存在时，只有root可用crontab

​    4）日志相关

​	crontab运行的痕迹在哪？

​	总有人质疑你的crontab中的脚本是否在运行

​	从/var/log/cron确认

​	cron    cron.1  cron.2  cron.3  cron.4

​	从cron日志恢复你的周期性任务，如何恢复？

​	有不足，长周期可能无法恢复！

​	用你的crontab备份，备份文件/var/spool/cron/用户名

​    提问：如果要实现更小周期怎么办？比如每隔10S、20S

​    5）系统自身的crontab

 	/etc/crontab其内容如下：

​	SHELL=/bin/bash

​	PATH=/sbin:/bin:/usr/sbin:/usr/bin

​	MAILTO=root

​	HOME=/

​	#run-parts

​	01 * * * * root run-parts /etc/cron.hourly     //每个小时

​	02 4 * * * root run-parts /etc/cron.daily      //每天

​	22 4 * * 0 root run-parts /etc/cron.weekly     //每个星期

​	42 4 1 * * root run-parts /etc/cron.monthly    //每个月



2、一次性at

​	1）服务管理

​		 systemctl   restart/stop/start    atd.service 

​	2）任务管理

​		 指定某个时刻运行

​          #at 15:10 2024-06-01   //用ctrl+d结束编辑

​         指定多长时间后运行

​         #at  now +2 minutes

​         查看还未执行的作业  

​         #atq

​         删除作业  

​         #atrm 作业号		

3、练习

​	1）root用户每周一4，5，6，8点00分 运行date >>/tmp/dbrecover.log

​	2）新建一个用户cronuser，写入/etc/cron.allow  和/etc/cron.deny文件中，则该用户能否编写1中的crontab任务
