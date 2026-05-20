Linux管道和常用命令介绍

1、常用命令介绍

​	1）#tail  -n  10 filename                                                       #取最后10行内容

​	2）#tail  -f  file                                                                      #实时监听文件输出

​	3）#head  -n 10  filename                                                    #查看文件头10内容

​	4）#stat  filename                                                                #查看文件信息

​	5）#du  -sh  文件或目录                                                      #计算文件或目录的大小

​	6）#df -h                                                                              #查看磁盘挂载情况

​	问题：取第10行内容？      head  file   | tail  -n  1  

​	7）tar命令

​	#tar  -jxvpf  /-jcvpf  /-zxvpf  /-zcvpf    目标文件    源文件或目录   

​	#tar  -cvf - /etc | tar  -xvf  -     

​	将当前目录下所有.txt文件打包并压缩归档到文件this.tar.gz，我们可以使用tar czvf this.tar.gz ./*.txt

​	将当前目录下的 this.tar.gz中的文件解压到当前目录我们可以使用tar -xzvf this.tar.gz -C ./

​	#排除指定文件和目录后，进行打包压缩

​		a、tar  -jcvpf  etc.tar.bz2     --exclude=sysconfig(目录)  --exclude=hosts（文件）  /etc  

​		b、(错误写法tar  -jcvpf  etc.tar.bz2    /etc  --exclude=sysconfig(目录)  --exclude=hosts（文件）)

​	恢复指定文件tar -jxvpf  etc.tar.bz2   etc/passwd   etc/shadow  

​	tar看打包了哪些文件和目录 #tar  tvf   etc.tar.bz2

​	8）gzip压缩文件    gzip -9  file  //gzip file 

​          压缩目录gzip -r filename.gz  file1 file2 etc

​         unrar  x file.rar

2、管道命令介绍

​	1）通过“|” 进行连接

​	2）前方命令的输出做为后方命令的输入,即后方命令处理前方命令的结果

​	3）例子：   命令a  |   命令b  | 命令c

​	4）grep命令

​		cat   /etc/hosts  |grep 192.168.15.1  

​		cat   /etc/hosts  |grep “192.168.15.1 “

​		cat   /etc/hosts  |grep -v  192.168.15.1   //除了，其他的都要

​		cat  /etc/hosts |egrep "192.168.1.5|192.168.15.11"

​		grep  -i  //忽略大小写

​		grep  -r  “ipaddr”   ./    //在当前路径下查找所有含有ipaddr字符串这个内容的文件

​		grep -o    password=....   anaconda-ks.cfg     //抓特定串

​		grep  -A  2   -B    2  rootpw   anaconda-ks.cfg     //抓关键词的指定行

​	5）cut命令

​		cat  /etc/passwd |cut -d “:”  -f  1

​		cat  /etc/passwd |cut  -d “:"   -f  1,3

​		-d后面跟的是分割符

​		-f后面跟的是第几个字段 

​		cat  /etc/passwd |cut  -c 10-      //取第10个字符到行末

​		df  -h  |cut  -c  1-10                   //取第1个到第10个字符

​	6)  sort命令

​		-f  ：忽略大小写

​		-b  ：忽略最前面的空白部分；

​		-M  ：以月份的名字來排序，例如 JAN, DEC 等等的排序方法；

​		-n  ：按数字排序,不指定n时，默认以第一个数据来进行排序

​		-r  ：反向排序（从大到小，默认是从小到大）

​		-u  ：就是 uniq ，重复行只显示一行

​		-t  ：分隔符，默认是tab键做为分割符

​		-k  ：按那个字段来进行排序

​		cat  /etc/passwd |sort -t ":"  -k 3  -n  

​		cat  /etc/passwd |sort -t ":"  -k 3  -n  |cut  -d ":"  -f  3

​	7）uniq命令

​		[root@homeworknote tmp]# cat  /tmp/t2

​		aa

​		bb	

​		bb

​		cc

​		cc

​		bb

​		bb

​		dd

​		测试命令

​		cat  t2  |uniq  -c  		//cat t2  |uniq

​		cat t2 |sort |uniq  -c 	//cat t2 |sort |uniq

​	8）wc命令

​		wc  -l   多少行	

​		wc   -w  多少单词

​		wc   -m 多少字符

​		cat /tmp/t2 |wc  -l

​		[root@homeworknote tmp]# cat  /tmp/t3

​		1

​		[root@homeworknote tmp]# cat  /tmp/t3 |wc       

​		1       1       2

​		[root@homeworknote tmp]# cat -A /tmp/t3

​		1$



3、练习

​	1）对apache.log日志分析a:访问最多的前10个IP，出现的次数，由多到少排序 ！

​	2）通过管道方式取出你的IP地址（192.168的地址)





