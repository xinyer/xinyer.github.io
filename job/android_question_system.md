---
layout: default
title: 系统
parent: 面试题
nav_order: 1
---

- [1.  AOSP 中常用的命令](#1--aosp-中常用的命令)
  - [1.1. 编译](#11-编译)
  - [1.2. 系统信息](#12-系统信息)
  - [1.3. 文件](#13-文件)
- [2. AOSP 项目目录结构](#2-aosp-项目目录结构)
  - [2.1. 根目录](#21-根目录)
  - [2.2. frameworks/base 目录](#22-frameworksbase-目录)
- [3. AOSP 编译系统](#3-aosp-编译系统)
- [4. AMS WMS PMS 的依赖关系](#4-ams-wms-pms-的依赖关系)
- [5. Android 系统启动过程](#5-android-系统启动过程)

## 1.  AOSP 中常用的命令

### 1.1. 编译

在 envsetup.sh 里定义的一些 shell 函数。

`gettop` : 获取 WOEKING_DIRECTORY 目录的完整路径

`croot` : 回到 WOEKING_DIRECTORY 目录

`m` : make 的缩写    -jx  参数-j 表示 job  后面的 x：表示工作的线程数

`mm` : 表示编译当前目录的 mk 文件

`mmm` : 标识编译指定目录下的 mk 文件，例如当修改 common 文件后，编译其他目录的 App 应用

`cgrep` : 执行 grep 命令，但是只匹配 C/C++的源文件。

`jgrep` : 执行 grep 命令，但是只匹配 Java 源文件。

`resgrep` : 执行 grep 命令，但是只匹配路径名为 res/下的 xml 资源文件。

`godir` : 去某一个目录。第一次执行会将 AOSP 的所有目录路径保存在 filelist 文件中。

### 1.2. 系统信息

`netstat -ap | grep 8080` : 查找进程占用

`ps|grep jack` : 查找进程 ID

`kill -9 PID` : 杀死进程

`ifconfig` : 查看 IP 信息

`free –m/-h` : 查看内存使用情况 @link

`df –h` : 显示磁盘使用情况 @link

### 1.3. 文件

文件查找

`find . -name "WebViewBrowserActivity.java"` : 查找 WebViewBrowserActivity.java 文件

文件内容查找

`find -type f -name '*.mk'|xargs grep 'Launcher3'` : 查找当前目录.mk 文件中 Launcher3 字符串

删除文件

`rm file`

`rm -r file/path` : 递归删除

`rm -rf file/path` : 强制递归删除

## 2. AOSP 项目目录结构

### 2.1. 根目录

① art：ART 运行环境

② bionic：Android 的 C library 基础库，NDK 的 API

③ bottable：启动引导程序相关代码

④ build：存放系统编译规则及 generic 等基础开发包配置（脚本和工具）

⑤ cts：Compatibility Test Suite 的缩写，Android 兼容性标准测试套件

⑥ dalvik：dalvik java 虚拟机

⑦ developers：应用程序开发 demo

⑧ devices：设备相关的代码和编译脚本

⑨ docs：AOSP 文档

⑩ external：其它平台移植项目

⑪ frameworks：应用程序核心框架，Android 系统的核心（Java 和 C++）

⑫ hardware：各手机厂商的硬件适配层 HAL 代码，硬件驱动相关。

⑬ kernel：Android Linux 系统内核

⑭ libcore：核心库

⑮ libnativehelper：动态库、实现 JNI 的基础库

⑯ packages：Android 原生应用程序包，ROM 应用开发者需要了解

⑰ pdk：Plug Development Kit 的缩写，本地开发套件

⑱ plateform_testing：平台测试相关

⑲ prebuilts：预编译资源

⑳ sdk：SDK 和模拟器

㉑ system：系统底层（C 语言）

㉒ test：测试相关

㉓ toolchain：工具链文件

㉔ tools：工具文件

㉕ vendor：厂商定制代码

### 2.2. frameworks/base 目录

这里面才是 frameworks 层最基础核心的代码，主要还是框架层面，涉及到图形图像、NFC、WiFi、蓝牙等硬件、系统服务等。

① sax：sax 实现

② obex：蓝牙传输库

③ services：各种系统服务

④ telephony：电话通讯相关的源码，联系人、短信相关的开发需要关注

⑤ libs：存储、USB 相关

⑥ core：核心库

⑦ graphics：图形相关

⑧ opengl：2D-3D 加速库

⑨ docs：文档

⑩ packages：系统应用。与根目录下的/packages 区别，也有系统应用比如 Settings

⑪ wifi：WiFi 相关源码

⑫ native：JNI

⑬ tools：工具相关

⑭ nfc：NFC 相关

⑮ data：字体、声音等数据文件



##  3. AOSP 编译系统

**Makefile**
Android 平台的编译系统，其实就是用 Makefile 写出来的一个独立项目。它定义了编译的规则，实现了“自动化编译”，不仅把分散在数百个 Git 库中的代码整合起来、统一编译，而且还把产物分门别类地输出到一个目录，打包成手机 ROM，还可以生成应用开发时所使用的 SDK、NDK 等。
因此，采用 Makefile 编写的编译系统，也可以称为 Makefile 编译系统。

**Android.mk**
Makefile 编译系统的一部分，定义了一个模块的必要参数，使模块随着平台编译。通俗来讲就是告诉编译系统，以什么样的规则编译你的源代码，并生成对应的目标文件。

**Ninja**
Ninja 是一个致力于速度的小型编译系统，如果把其他的编译系统看作高级语言，那么 Ninja 目标就是汇编。

**Soong**
Soong 是谷歌用来替代此前的 Makefile 编译系统的替代品，负责解析 Android.bp 文件，并将之转换为 Ninja 文件

**Blueprint**
Blueprint 用来解析 Android.bp 文件翻译成 Ninja 语法文件。

**kati**
kati 是谷歌专门为了 Android 而开发的一个小项目，基于 Golang 和 C++。目的是把 Android 中的 Makefile，转换成 Ninja 文件。

**Android.bp**
Android.bp，是用来替换 Android.mk 的配置文件。

![aosp build system](./assets/aosp_build_system.awebp)

## 4. AMS WMS PMS 的依赖关系
在 Android 系统中，AMS（Activity Manager Service）、PMS（PackageManager Service）和 WMS（Window Manager Service）是三个重要的系统服务，它们负责管理应用程序的生命周期、处理应用程序的安装和卸载、以及管理应用程序的窗口视图。以下是这些服务的详细解释及其在 Android 开发中的作用：

**AMS**（Activity Manager Service）作为活动管理器服务，它主要负责管理和跟踪所有应用程序的活动任务和生命周期。当一个应用程序被打开时，AMS 会启动该应用程序的进程，并给应用程序分配处理器资源和内存。当应用程序不再处于前台或后台，或者当系统内存不足时，AMS 会终止或杀死这个应用程序的进程。

**PMS**（PackageManager Service）作为包管理器服务，主要负责在 Android 设备上安装、管理和卸载应用程序。当一个新的应用程序被安装时，PMS 将识别应用程序的所有组件（如 Activity、Service 和 Broadcast Receiver 等），并为这些组件分配相应的权限。同时，PMS 还监控已安装应用程序的状态，确保应用程序的完整性和安全性。

**WMS**（Window Manager Service）作为窗口管理器服务，它主要负责管理 Android 设备上的窗口视图，并控制应用程序的界面和正确的显示和输入。WMS 负责管理应用程序窗口的位置、大小和布局，照顾多任务操作和应用程序之间的切换，从而确保用户界面稳定、流畅和一致。

- 当用户开始一个新的应用程序，AMS 启动该应用程序的进程并分配系统资源。
- 一旦应用程序被启动，AMS 将在 WMS 上安排应用程序窗口的位置和大小，从而形成用户与应用程序的交互界面。
— PMS 管理应用程序的组件信息和权限，确保应用程序能够正确地运行和访问设备资源。如果一个应用程序请求特殊的权限，PMS 会检查设备的安全性并授权许可。
— WMS 管理并根据用户输入事件调整应用程序的窗口管理。当用户使应用程序不再前台或后台时，AMS 将监控应用程序生命周期并调整其状态。

AMS、PMS 和 WMS 三个系统服务一起工作，构成了 Android 运行环境中的关键组件和应用程序的核心支持，为应用程序的运行提供了全面和可靠的保障。
Android 应用程序开发中，AMS、PMS 和 WMS 三个服务相互协调工作，是应用程序能够高效稳定地运行的保证。

## 5. Android 系统启动过程

1.启动电源以及系统启动
加载引导程序 Bootloader 到 RAM，然后执行。

2.引导程序 BootLoader 启动
引导程序 BootLoader 是在 Android 操作系统开始运行前的一个小程序，它的主要作用是把系统 OS 拉起来并运行。

3.Linux 内核启动
内核启动时，设置缓存、被保护存储器、计划列表、加载驱动。当内核完成系统设置，它首先在系统文件中寻找 init.rc 文件，并启动 init 进程。

4.init 进程启动
init 进程是系统空间内的第一个进程，进行初始化和启动属性服务，在 main 方法中进行，包括初始化资源文件和启动一系列的属性服务。通过执行 init.rc 文件的脚本文件来启动 Zygote 进程。

5.Zygote 进程启动
所有的应用程序包括 system 系统进程 都是 zygote 进程负责创建，因此 zygote 进程也被称为进程孵化器，它创建进程是通过复制自身来创建应用进程，它在启动过程中会在内部创建一个虚拟机实例，所以通过复制 zygote 进程而得到的应用进程和系统服务进程都可以快速地在内部的获得一个虚拟机实例拷贝。

6.SystemServer 进程启动
启动 Binder 线程池和 SystemServiceManager，systemServiceManger 主要是对系统服务进行创建、启动和生命周期管理，就会启动各种系统服务。（android 中最核心的服务 AMS 就是在 SystemServer 进程中启动的）

7.Launcher 启动
Launcher 组件是由之前启动的 systemServer 所启动的
这也是 andorid 系统启动的最后一步，launcher 是 andorid 系统 home 程序，主要是用来显示系统中已安装的应用程序。launcher 应用程序的启动会通过请求 packageManagerService 返回系统中已经安装的应用信息，并将这些应用信息通过封装处理成快捷列表显示在系统屏幕上，这样咱们就可以单击启动它们。
被 SystemServer 进程启动的 ActivityManagerService 会启动 Launcher，Launcher 启动后会将已安装应用的快捷图标显示到界面上。
