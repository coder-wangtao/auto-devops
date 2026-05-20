#!/bin/bash
#function:install apache  mysql    php
#author:20200101 system group
##########################################
tarbagp=/usr/local/src/tarbag
software=/usr/local/src/software
mkdir -p   $tarbagp
mkdir -p   $software

#Httpd define path variable
H_FILES=httpd-2.2.32.tar.bz2
H_FILES_DIR=httpd-2.2.32
H_URL=http://archive.apache.org/dist/httpd
H_PREFIX=/usr/local/apache2/


#PHP define path variable
P_FILES=php-5.3.28.tar.bz2
P_FILES_DIR=php-5.3.28
P_URL=http://mirrors.sohu.com/php/
P_PREFIX=/usr/local/php5/
#判断文件是否存在，如果存在就不用下载了
function is_exist()
{
	if [ ! -f $tarbagp/$1 ];then
		echo  "开始下载$1"	
		return 2
	fi
}

#Install httpd web server

function httpd_install(){

if [[ "$1" -eq "1" ]];then
   cd $tarbagp;
   #判断文件是否存在
   is_exist $H_FILES
   if [ $? -eq "2" ] ;then
   	wget -c $H_URL/$H_FILES
   fi
   if [ $? -eq 0 ];then
   	yum  -y  install  gcc 
        rm     -rvf    $software/$H_FILES_DIR	
  	tar -jxvf $H_FILES -C $software && cd $software/$H_FILES_DIR &&./configure --prefix=$H_PREFIX
   	if [ $? -eq 0 ];then
      		make && make install
		if [ $? -eq 0 ];then
			echo  "http安装成功"
			echo  "welcome to xxxxx  auto install http" > $H_PREFIX/htdocs/index.html
		fi
   	fi
    else 
	echo "$H_FILES 下载失败,清检查虚拟机网络"
   fi
fi
}

#Install Mysql DB server

function mysql_install(){
	yum  install -y  mariadb*
	ln  -sf   /usr/lib64/mysql    /usr/lib/mysql
}
#install  libiconv 
function install_libiconv()
{
	cd    $tarbagp
	#wget   -c   http://ftp.gnu.org/gnu/libiconv/libiconv-1.15.tar.gz
	tar -zxvpf   libiconv-1.15.tar.gz    -C   $software
	cd   $software/libiconv-1.15
	./configure
	make
	make install
	cp  /usr/local/lib/libiconv*     /usr/lib/
	cp  /usr/local/lib/libiconv*     /usr/lib64/
}
#Install PHP server

function php_install(){
yum  install  -y  gcc   libxml2-devel.x86_64
install_libiconv
cd $tarbagp
if [ ! -f $tarbagp/$P_FILES ];then
	wget -c $P_URL/$P_FILES 
else
	if [[ "$1" -eq "3" ]];then
        	#tar -jxvf $P_FILES -C $software && cd $software/$P_FILES_DIR &&./configure --prefix=$P_PREFIX --with-config-file-path=$P_PREFIX/etc --with-mysql=$M_PREFIX --with-apxs2=$H_PREFIX/bin/apxs
        	tar -jxvf $P_FILES -C $software && cd $software/$P_FILES_DIR &&./configure --prefix=$P_PREFIX --with-config-file-path=$P_PREFIX/etc --with-mysql --with-apxs2=$H_PREFIX/bin/apxs
        	if [ $? -eq 0 ];then
                	make ZEND_EXTRA_LIBS='-liconv' && make install
                	echo -e "\n\033[32m-----------------------------------------------\033[0m"
                	echo -e "\033[32mThe $P_FILES_DIR Server Install Success !\033[0m"
        	else
                	echo -e "\033[32mThe $P_FILES_DIR Make or Make install ERROR,Please Check......"
                	exit 0
        	fi
	fi
fi
}

function lamp_config(){
if [[ "$1" -eq "4" ]];then
   sed -i '/    AddType application\/x-gzip .gz .tgz/a\\    AddType application\/x-httpd-php-source .phps'  $H_PREFIX/conf/httpd.conf
   sed -i '/    AddType application\/x-gzip .gz .tgz/a\\    AddType application\/x-httpd-php .php'  $H_PREFIX/conf/httpd.conf
   sed -i '/DirectoryIndex/s/index.html/index.php index.html/g' $H_PREFIX/conf/httpd.conf
   $H_PREFIX/bin/apachectl restart
   echo "AddType     application/x-httpd-php .php" >>$H_PREFIX/conf/httpd.conf
   IP=`ifconfig ens34|grep "Bcast"|awk '{print $2}'|cut -d: -f2`
   echo "You can access http://$IP/"

cat >$H_PREFIX/htdocs/index.php <<EOF
<?php
phpinfo();
?>
EOF
fi
}



#select choice

PS3="Please enter you select install menu:"
select i in http mysql php config  all exit
do

case $i in
    http)
    httpd_install 1
    ;;
    mysql)
    mysql_install 2
    ;;
    php)
    php_install 3
    ;;
    config)
    lamp_config 4
    ;; 
    all)
    httpd_install 1
    mysql_install 2
    php_install 3
    lamp_config 4
    ;;
    exit)
    echo "The system exit"
    exit
esac

done


