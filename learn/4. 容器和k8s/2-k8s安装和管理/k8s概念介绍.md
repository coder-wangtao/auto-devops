一、k8s概念介绍

1、k8s介绍

kubernetes，简称K8s，是用8代替8个字符“ubernete”而成的缩写。是一个开源的，用于管理云平台中多个主机上的容器化的应用，Kubernetes的目标是让部署容器化的应用简单并且高效（powerful）,Kubernetes提供了应用部署，规划，更新，维护的一种机制。

Kubernetes积累了作为Google生产环境运行工作负载15年的经验，并吸收了来自于社区的最佳想法和实践。Kubernetes经过这几年的快速发展，形成了一个大的生态环境，Google在2014年将Kubernetes作为开源项目。Kubernetes的关键特性包括：自动化装箱：在不牺牲可用性的条件下，基于容器对资源的要求和约束自动部署容器。同时，为了提高利用率和节省更多资源，将关键和最佳工作量结合在一起。

1）自愈能力：当容器失败时，会对容器进行重启；当所部署的Node节点有问题时，会对容器进行重新部署和重新调度；当容器未通过监控检查时，会关闭此容器；直到容器正常运行时，才会对外提供服务。

2）水平扩容：通过简单的命令、用户界面或基于CPU的使用情况，能够对应用进行扩容和缩容。服务发现和负载均衡：开发者不需要使用额外的服务发现机制，就能够基于Kubernetes进行服务发现和负载均衡。

3）自动发布和回滚：Kubernetes能够程序化的发布应用和相关的配置。如果发布有问题，Kubernetes将能够回归发生的变更。保密和配置管理：在不需要重新构建镜像的情况下，可以部署和更新保密和应用配置。

4）存储编排：自动挂接存储系统，这些存储系统可以来自于本地、公共云提供商（例如：GCP和AWS）、网络存储(例如：NFS、iSCSI、Gluster、Ceph、Cinder和Floker等)。

2、k8s集群

一个K8S集群由两部分构成 master节点和node节点。

1）master节点主要负责集群的控制，对pod进行调度，以及令牌管理等等功能。

2）node节点主要是负责干活，启动容器、管理容器。

3）master节点和node节点一般不要部署在一台机器上。实际生产上，从高可用考虑，是需要部署多个master节点的。

你需要在每台机器上安装以下的软件包：

​	kubeadm：用来初始化集群的指令。

​	kubelet：在集群中的每个节点上用来启动 Pod 和容器等。

​	kubectl：用来与集群通信的命令行工具。



k8s master

1）Api Server：对外暴露K8S的api接口，是外界进行资源操作的唯一入口，并提供认证、授权、访问控制、API注册和发现等机制；

2）scheduler负责资源的调度，按照预定的调度策略将Pod调度到相应的机器上；就是监视新创建的 Pod，如果没有分配节点，就选择一个节点供他们运行，这就是pod的调度。pod是k8s的最小工作单元,每个pod包含一个或多个容器。

3）controller manager负责维护集群的状态，比如故障检测、自动扩展、滚动更新等，它们是处理集群中常规任务的后台线程

4)  etcd：kubernetes的后端数据库，k/v方式存储，所有的k8s集群数据都存放在此处。保存了整个集群的状态

<img src="/Users/hellen/Library/Application Support/typora-user-images/image-20240814193139008.png" alt="image-20240814193139008" style="zoom:50%;" />



K8s最小工作单元-pod

K8s引入pod主要基于如下目的：

1） 管理问题： 有些容器之间联系紧密，需要pod这种更高层次的抽象，将其封装成一部署单元。k8s以pod为最小单位进行调度、扩展、管理。

2） pod中的所有容器使用同一个网络namespace,即相同的Ip地址和port空间，可直接localhost通信。pod中的容器可以共享存储，当k8s挂载volume到pod，本质上是将volume挂载到pod中的每一个容器上。

在Kubrenetes集群中Pod有如下两种使用方式：

1）一个Pod中运行一个容器。“每个Pod中一个容器”的模式是最常见的用法：在这种使用方式中，你可以把Pod想象成是单个容器的封装，kuberentes管理的是Pod而不是直接管理容器。

2）在一个Pod中同时运行多个容器。一个Pod中也可以同时封装几个需要紧密耦合互相协作的容器，它们之间共享资源。这些在同一个Pod中的容器可以互相协作成为一个service单位——一个容器共享文件，另一个“sidecar”容器来更新这些文件。Pod将这些容器的存储资源作为一个实体来管理。

<img src="/Users/hellen/Library/Application Support/typora-user-images/image-20240814193353378.png" alt="image-20240814193353378" style="zoom:50%;" />



K8s概念-controller

K8s通常不会直接创建pod,而是通过controller来管理pod的。比如几个副本，在什么node上运行等。K8s提供了多种controller,包括Deployment、ReplicaSet、DaemontSet、StatefulSet、Job等

1）Deployment：这是在使用kubernetes时候，大家部署系统或者是服务经常使用的一种controller类型。因为我们可以通过它来使用ReplicaSet来为我们部署的应用进行副本的创建。一般在实际的运用中，大家用 Deployment 做应用的真正的管理，而 Pod 是组成 Deployment 最小的单元。

2）ReplicaSet：实现了 Pod 的多副本管理。使用 Deployment 时会自动创建 ReplicaSet，也就是说 Deployment 是通过 ReplicaSet 来管理 Pod 的多个副本，我们通常不需要直接使用 ReplicaSet。通过Deployment去使用ReplicaSet的话我们就不需要担心和其他机制的冲突（如：ReplicaSet不支持滚动更新，但是Deployment支持）。

<img src="/Users/hellen/Library/Application Support/typora-user-images/image-20240814193457323.png" alt="image-20240814193457323" style="zoom:50%;" />

3）DaemonSet 用于每个 Node 最多只运行一个 Pod 副本的场景。正如其名称所揭示的，DaemonSet 通常用于运行 daemon。当有Node加入集群时，也会为他们新增一个Pod，当有Node从集群中移除时，这个Pod同时也会回收。在删除DaemonSet的时候，会删除他创建的所有Pod。使用DaemonSet的一些例子：

​    （1）运行在集群存储的daemon，例如在每个node上运行的ceph；

​    （2）在每个node上运行日志收集daemon，例如fluentd、logstash；

​	（3）在每个node上运行的监控daemon，例如Prometheus Node Exporter。

4）StatefuleSet 是为了解决有状态服务的问题（对应Deployment和ReplicaSet是为无状态服务而设计的）。能够保证 Pod 的每个副本在整个生命周期中名称是不变的。而其他 Controller 不提供这个功能，当某个 Pod 发生故障需要删除并重新启动时，Pod 的名称会发生变化。同时 StatefuleSet 会保证副本按照固定的顺序启动、更新或者删除。

应用的场景：

​	a.需要稳定的持久化存储；

​	b.需要稳定的网络标志（即Pod被重新调度时网络访问不变）；

​	c.有序部署和有序扩展；4.有序收缩和删除。使用的服务有：MySQL集群、MongoDB集群、ZooKeeper集群等。

5）Job ：批处理任务通常并行（或者串行）启动多个计算进程去处理一批工作项（work item），在处理完成后，整个批处理任务结束。适用于运行结束就删除的应用。而其他 Controller 中的 Pod 通常是长期持续运行。

6）CronJob：相应的，kubernetes为我们提供定时进行的批处理任务，解决了某些批处理任务需要定时反复执行的问题



k8s-service

Deployment可以部署多个副本，每个pod都有自己的ip,外界如何访问这些副本？pod会被频繁的销毁和重启，ip会变。我们可以通过service来访问。

K8s运行容器通过controller来做，访问容器通过service来做。  在Serive定义时，我们需要指定spec.type字段，这个字段拥有四个选项：

1）ClusterIP。默认值。给这个Service分配一个Cluster IP，它是Kubernetes系统自动分配的虚拟IP，因此只能在集群内部访问。

2）  NodePort。将Service通过指定的Node上的端口暴露给外部。通过此方法，访问任意一个NodeIP:nodePort都将路由到ClusterIP，从而成功获得该服务。

3）LoadBalancer。在 NodePort 的基础上，借助 cloud provider 创建一个外部的负载均衡器，并将请求转发到 <NodeIP>:NodePort。此模式只能在云服务器（AWS等）上使用。

4）ExternalName。将服务通过 DNS CNAME 记录方式转发到指定的域名（通过 spec.externlName 设定）。需要 kube-dns 版本在 1.7 以上。
