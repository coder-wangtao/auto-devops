sed和awk

1、sed使用例子

1）sed是一个非交互性文本流编辑器，是一种重要的文本过滤工具。

2）sed  -e  进行多项编辑，即对输入行应用多条sed命令时使用

3）sed -e '1,10d' -e 's/My/YOU/g'  filesed   ‘2a add’    file      //加到第二行后面，就是成为第三行

4）sed   '2i insert'   file     //插入到第二行，新行就是第二行sed   '/^%end/a add'  1.cfg      

5）sed   '2,5d' datafile  //删除datafile中2到5行sed   '/my/,/you/d' datafile  //删除包含my的行到包含you的行之间的行

6）sed   '/my/,10d' datafile  //删除包含my的行到第10行的内容 

7）sed   -n '2p' /etc/passwd  打印出来/etc/passwd这个文件中第二行的内容出来

8）sed   -n '1,3p' /etc/passwd       打印出来 第一行到第三行的内容使用模式和行号进行查询

9）sed -n '/dev/'p /etc/fstab         能够得到相匹配的行记录出来的

10）sed -n '6,/dev/'p /etc/fstab显示整个文件只需将行的范围设为第一行到最后一行 (1,$)

11）sed  -n   '1,$p' /etc/fstab

提醒：如上的所有操作都不会对原始文件产生影响

12）sed     's/reiserfs/REISERFS/'  /etc/fstab

13）在符合条件的行前面添加一个#字符，起到注释的作用。

​		sed -i '/^adm/ s/^/#/g' /tmp/list.h

14）把注释去掉

​		sed  -i   '/^#adm/ s/^#//g'     my.cnf





15）有一个文本文件text.txt内容如下：#从服务器的配置:复制主服务器,帐号,密码,库,表

​	master-host = 192.168.100.90

​	master-user =repuser

​	master-password =123456

​	Replicate_Do_DB = mytianya

​	replicate-do-db=tianya_test

​	replicate-wild-do-table = mytianya.tb_user_space

​	我现在需要将master开头的那三行 前面添加上注释的话那我可以这样来写SED命令的

​	sed -i '/^master/ s/^/#/g' test.txt

2、awk使用

1）变量名 含义

​	ARGC 命令行变元个数

​	ARGV 命令行变元数组

​	FILENAME 当前输入文件名

​	FNR 当前文件中的记录号

​	FS 输入域分隔符，默认为一个空格

​	RS 输入记录分隔符NF 当前记录里域个数

​	NR 到目前为止记录数输出域分隔符

​	ORS 输出记录分隔符

​	显示文件file的当前记录（行）号、域（列）数和每一行的第一列和最后一个域（列），默认空格分割符awk '{print NR,NF,$1,$NF,}' file 

2）BEGIN 表示在处理任意行之前进行的操作。

​	awk  'BEGIN { FS=":" } $3>499 {print $0}' /etc/passwd

​	awk  -F     ":"     '$3>999 {print $0}' /etc/passwd

​	awk  'BEGIN { FS=":" }{ OFS="--" } $3>499 {print $1,$3}' /etc/passwd

​	awk   '{ max=100 ;print "max="($1 >max ?$1:max);print $1,max}' file

3）awk中调用系统变量必须用单引号

​	#!/bin/bash

​	#function 在awk中调用系统变量必须用单引号，如果是双引号，则表示字符串

​	#author

​	awk -F ":" '{print $'$1'}'   /etc/passwd

