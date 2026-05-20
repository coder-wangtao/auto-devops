Linux ssh服务管理

1、ssh安装和管理

​	1）默认服务在22端口监听   netstat   -ntpl  |grep  :22

​	2）启动和关闭    

​		service  sshd  restart /start /stop    

​		systemctl start/stop/restart/status sshd.service

​	3）随机启动   

​		systemctl enable/disable  sshd.service

2、ssh配置

1）配置   

​	配置文件：/etc/ssh/sshd_config   配置修改后，需重新启动服务

​	ListenAddress 192.168.0.1port  22

​	是否禁止root远程登录PermitRootLogin   yes/no

3、ssh连接验证

​	SSH验证：从客户端来看，SSH提供两种级别的安全验证。

​	第一种级别（基于口令的安全验证）只要你知道自己帐号和口令，就可以登录到远程主机。

​	第二种级别（基于密匙的安全验证）需要依靠密匙，也就是你必须为自己创建一对密匙，并把公用密匙放在需要访问的服务器上。如果你要连接到SSH服务器上，客户端软件就会向服务器发出请求，请求用你的密匙进行安全验证。服务器收到请求之后，先在该服务器上你的主目录下寻找你的公用密匙，然后把它和你发送过来的公用密匙进行比较。如果两个密匙一致，服务器就用公用密匙加密“质询”（challenge）并把它发送给客户端软件。客户端软件收到“质询”之后就可以用你的私人密匙解密再把它发送给服务器。用这种方式，你必须知道自己密匙的口令。但是，与第一种级别相比，第二种级别不需要在网络上传送口令。

​	1）验证方式

​		a、密码验证方式

 		ssh  192.168.116.3   相当于ssh root@192.168.116.3    -p  22 

​		 ssh  user@192.168.116.3  输入对应IP上指定用户名的密码方可登录 

​		 ssh 192.168.116.3  -p 21  

​		b、无密码方式验证

​		第一种方法

​		客户端：192.168.77.131   进行如下操作  

​			生成公钥和密钥   

​			#ssh-keygen -t  rsa //ssh-keygen不加-t默认用rsa加密方式（也可使用ssh-keygen   -t  dsa）    			生成成功后，会在/root/.ssh/目录下，产生两个文件 id_rsa  id_rsa.pub   

​			#scp   /root/.ssh/id_rsa.pub  root@192.168.77.128:/home/   

​		服务器端:192.168.77.128   进行如下操作

​			#touch   /root/.ssh/authorized_keys   //这个文件若不存在的话，先创建   

​			#cat   /home/id_rsa.pub  >> /root/.ssh/authorized_keys   

​		测试：

​			在客户端上进行操作192.168.77.131，远程登录128,看是否需要密码验证  

​			 #ssh  root@192.168.77.128  //或#ssh  192.168.77.128

​		第二种方法

​		客户端：192.168.77.131    

​			生成公钥和密钥   #ssh-keygen    

​			#ssh-copy-id  -i  /root/.ssh/id_rsa.pub   192.168.77.128   

​		测试   

​			#ssh  root@192.168.77.128



​		小提问：        

​			第一个问题：

​			A能无密码方式登录root@B, 当B上面的root密码发生改变后，        

​			A是否还能无密码方式登录B机器        

​			第二个问题：

​			当B的IP变成了C，A是否能无密码方式登录C?



​	4、ssh相关的操作命令

​		scp  file  user@192.168.116.3:/tmp   //传文件

​		scp -r  directory user@192.168.116.3:/tmp  //传目录

​		已有文件或目录存在时，则不会被覆盖！

​		ssh  192.168.116.3 “command”

​		遥控操作：在192.168.116.3运行命令commandSsh  192.168.116.3 “ifconfig eth0”



​	5、ssh客户端工具

​		怎么去连接你的SSH服务，进行系统管理和维护

​		1） linux 终端

​		2） linux 图形界面下的gcm  (gnome-connection-manager)

​		3）putty

​		4）secureCRT  

​		5）xshell

​		6）xterm



​	6、练习

​		安排两台虚拟机A和B，确保A能无密码登录到B,B能无密码登录A





