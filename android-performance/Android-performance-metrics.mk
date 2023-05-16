---
layout: default
title: Android 应用性能指标
parent: Android Performance
nav_order: 4
---

![July2019_Articles_01_Mobile-APM-tools.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fce9e765337a492eb69b050edbbf8cb9~tplv-k3u1fbpfcp-watermark.image?)

无论你是发布一个新的 Android 应用，还是希望提高现有应用的性能，你都可以使用 Android 应用性能指标来帮助你分析应用的性能情况。

在这篇文章中，我将解释什么是 Android 应用性能指标，并列出8个需要考虑跟踪的维度和建议的基线。

## 什么是 Android 应用性能指标？

Android 应用性能指标量化了一个 Android 应用的性能。开发人员通过建立自己的跟踪系统或将应用程序连接到第三方平台来收集这些数据。无论采用何种收集方法，性能指标都能表明一些关键信息，如应用程序的流畅度以及界面对用户反应灵敏度等。有了这些信息，开发者可以优化应用的性能问题，以改善整体用户体验。

## 为什么 Android 应用性能指标很重要？

Android 应用性能指标很重要，因为它们可以帮助开发者确定其产品的性能。通过比较实际数据和期望，开发者可以重新评估他们的期望或对应用程序进行优化。

这些指标也可以帮助企业
- 创造更好的用户体验
- 促进更好的品牌忠诚度
- 指导开发吸引大众市场的新应用
- 在其行业内保持竞争力

## 8个 Android 应用性能指标

### 1. 应用启动时间

> 从用户点击应用图标启动应用到看到第一页的时间

**基线**

冷启动时间 $P_{50} < 2s$

> $P_k表示第k百分位数$
> 
> 百分位数（Percentile）是统计学术语，若将一组数据从小到大排序，并计算相应的累计百分点，则某百分点所对应数据的值，就称为这百分点的百分位数

----

应用程序的启动可以在三种状态下进行，每种状态都会影响你的应用程序对用户可见的时间：冷启动（Cold Startup）、温启动（Warm Startup）和热启动（Hot Startup）。在冷启动中，你的应用程序从头开始。在其他状态下，系统需要将运行中的应用从后台带到前台。

Android使用初始显示时间（TTID）和完全显示时间（TTFD）指标来优化冷启动和温启动的应用程序。Android 运行时 (ART) 使用这些指标的数据来高效地预编译代码，以优化未来的启动过程。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/103747a98a3b4860ae4e494687a55f53~tplv-k3u1fbpfcp-watermark.image?" alt="startup types" width="50%" />

### 2. 冻结帧（Frozen Frame）

> 冻结帧是指渲染时间超过700ms的界面帧。

这意味着你的应用在帧的呈现过程中几乎有一秒钟的时间卡住不动，对用户输入无响应。我们通常建议应用在 16ms 内呈现帧，以确保界面流畅。但是，当应用启动或转换到其他屏幕时，初始帧的绘制时间通常会超过 16ms，这是因为应用必须扩充视图，对屏幕进行布局并从头开始执行初始绘制。因此，Android 将冻结帧（frozen frame）与呈现速度缓慢（slow rendering）分开跟踪。建议应用中的任何帧的呈现时间都不应超过 700ms。

**基线**

冻结帧的百分比应该小于1%。

### 3. 卡顿（Slow Rendering）
> 应用程序渲染的帧数超过16ms（低于60fps），系统就会被迫跳帧，用户就会感觉到应用程序的卡顿。  
  
**基线**  
  
慢速帧的百分比应低于5%。

----

界面呈现是指从应用生成帧并将其显示在屏幕上的动作。如需确保用户能够流畅地与你的应用互动，应用呈现每帧的时间不应超过 16ms，以达到每秒 60 帧的呈现速度。如果应用存在界面呈现缓慢的问题，系统会不得不跳过一些帧，这会导致用户感觉到应用不流畅，这种情况称为卡顿（jank）。这个 16ms 的数字来自于手机的硬件，它定义了屏幕在一秒钟内可以更新的速度。现在大多数设备以 60赫 兹的速度更新，这意味着你有 16ms 的时间来执行每一帧的所有逻辑。如果错过了这个时间窗口，就会丢帧。

### 4. 应用程序无响应（Application No Responseding）

> 当UI线程被阻塞超过5秒时，会触发应用程序无响应（ANR）错误。

基线

1. 日活中出现一次ANR的比例应该小于0.47%。

2. 日活中出现两次或更少的ANR的比例应该小于0.24%。

> 日活指的是一日内登录或使用应用程序的用户数。

----

如果 Android 应用的界面线程处于阻塞状态的时间过长，会触发“应用无响应”(ANR) 错误。如果应用位于前台，系统会向用户显示一个对话框，如下所示。ANR 对话框会为用户提供强制退出应用的选项。

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/589cda00f5e746bdbdf5cfab97481d03~tplv-k3u1fbpfcp-watermark.image?" alt="anr-example-framed.png" width="50%" />

### 5. 崩溃（Crash）
> 只要出现未处理的异常或信号导致的意外退出，Android应用就会崩溃。

**基线**

没有出现崩溃的比例应该大于99.95%

----

使用 Java 或 Kotlin 编写的应用会在抛出未处理的异常（由 `Throwable` 类表示）时崩溃。使用机器码或 C++ 语言编写的应用会在执行过程中遇到未处理的信号（如 `SIGSEGV`）时崩溃。

当应用崩溃时，Android 会终止应用的进程并显示一个对话框，告知用户应用已停止，如下图所示。

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a977a22f26b4ab291c063d1c5a427ac~tplv-k3u1fbpfcp-watermark.image?" alt="crash-example-framed.png" width="50%" />

### 6. 内存消耗（Memory Consumption）
> 应用程序当前使用的物理内存的大小。

**基线**

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b8ae434336e04c8bb41d1cec5208f8d5~tplv-k3u1fbpfcp-watermark.image?" alt="Untitled_2023-03-02_04-43-47.png" width="50%" />

如果 Android 应用程序消耗过多的内存，在运行时可能无法在内存中分配一个对象，就会抛出一个 `OutOfMemoryError`，导致应用突然崩溃，并显示应用程序 "已经停止 "的通知，创造一个糟糕的用户体验。

### 7. CPU 利用率（CPU percent utilization）
> 应用在运行时耗费的 CPU 处理能力的百分比

**基线**

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c4475365c9da4d7c91276741c2481995~tplv-k3u1fbpfcp-watermark.image?" alt="android performance mertrics.png" width="50%" />

----

CPU 利用率是用来量化处理器在应用程序之间的共享情况。单个应用程序的高 CPU 利用率可能表明它对处理能力的要求很高，或者它可能出现故障并影响你的用户设备的电池寿命。

### 8. 网络响应时间（Network Response Time）
> 响应时间是指服务器响应客户的请求所需的时间。计时器以毫秒为单位，从客户发出请求的那一刻开始，到服务器发回第一个响应时停止。

**基线**

$P_{90} < 1s$

> $P_k表示第k百分位数$
> 
> 百分位数（Percentile）是统计学术语，若将一组数据从小到大排序，并计算相应的累计百分点，则某百分点所对应数据的值，就称为这百分点的百分位数

----

响应时间有时被定义为第一个字节的时间（TTFB），它是指从客户端请求到第一个数据包被发回给客户端的时间。响应时间不包括客户的设备渲染或处理任何收到的数据所需的时间。

## 参考
- [android developer # launch time](https://developer.android.com/topic/performance/vitals/launch-time)
- [android developer # frozen](https://developer.android.com/topic/performance/vitals/frozen)
- [android developer # render](https://developer.android.com/topic/performance/vitals/render)
- [android developer # anr](https://developer.android.com/topic/performance/vitals/anr)
- [android developer # crash](https://developer.android.com/topic/performance/vitals/crash)
- [mobile vitals](https://docs.datadoghq.com/real_user_monitoring/android/mobile_vitals/)
- [monitor mobile vitals datadog](https://www.datadoghq.com/blog/monitor-mobile-vitals-datadog/?_gl=1*6bbvy9*_ga*NjkyMDY1NTI1LjE2NTU5Nzc0MjA.*_ga_KN80RDFSQK*MTY2MTQ5NTI0MC42LjEuMTY2MTQ5NTI0OS41MS4wLjA)