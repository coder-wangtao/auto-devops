sudo和su

1、su的使用

​	su  -    //切换到root用户下

​	su  -  Username   //切换到userame用户下

​	su - 和su的区别   

​		//建议使用 -    是否读入想切换的身份者的环境参数文件	-彻底转换，未加-，会保留之前的（PATH和pwd）  

​	退出用户用exit

2、sudo的使用

​    用户执行命令的使用，在命令前面加sudo，实现提权执行 

​	1）编辑sudo

​         visudo 和 vim /etc/sudoers

​	2)	配置sudo

​		  用户或组  登录的主机 =  (可切换的身份)  可执行的命令

​		 用户或组：username    %groupname           或用别名 User_Alias ADMINS = jsmith, 

​         登录的主机： hostname  

​         可切换的身份系统上的用户，如果没有指定，默认是进行root的身份切换 。是ALL,就是可切换成任何本机上的帐号

​         可以执行的命令   NOPASSWD: ALL  无需输入当前用户的密码，所有命令都可执行   

​         无NOPASSWD，就需输入当前用户的密码

​         列子：

​         例子1：   %wheel        ALL=(ALL)       ALL

​		 例子2：   wheel        ALL=(ALL)       NOPASSWD: ALL

​		 例子3：

​			User_Alias ADMPW = jsmith, mikem

​			ADMPW  ALL = NOPASSWD:  !/usr/bin/passwd,/usr/bin/passwd [A-Za-z*],!/usr/bin/passwd root

​		例子4：Cmnd_Alias SOFTWARE = /bin/rpm, /usr/bin/up2date, /usr/bin/yum

​			ADMPW  ALL = SOFTWARE
