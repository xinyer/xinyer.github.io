---
title: Android 面试题 - 系统篇
date: 2023-06-20 14:11:00 +0800
categories: [Android]
tags: [面试题，系统]
---

- [1. Handler 如何实现线程切换](#1-handler-如何实现线程切换)
- [2. Android View 的绘制步骤？](#2-android-view-的绘制步骤)
- [3. 系统层面 Android View 的绘制原理](#3-系统层面-android-view-的绘制原理)
- [4. Android 应用中点击事件是如何在 View 之间传递的？](#4-android-应用中点击事件是如何在-view-之间传递的)
- [5. 为什么 Android 组件需要在 AndroidManifest.xml 文件中声明？](#5-为什么-android-组件需要在-androidmanifestxml-文件中声明)
- [6. Android 开发中有哪些线程安全的数据结构？](#6-android-开发中有哪些线程安全的数据结构)
- [7. 避免线程死锁](#7-避免线程死锁)
- [8. 什么是线程安全？](#8-什么是线程安全)
- [9. 如何保证线程安全？](#9-如何保证线程安全)
- [10. Java 中 synchronized 和 volatile 的区别和用法？](#10-java-中-synchronized-和-volatile-的区别和用法)
- [11. lock 和 synchronized 的区别](#11-lock-和-synchronized-的区别)
- [12. 从 Android 系统层面说明 Activity 的启动过程？](#12-从-android-系统层面说明-activity-的启动过程)
- [13. Android 中通过 binder 实现跨进程通信，在设计一个跨进程服务时，应该注意些什么？](#13-android-中通过-binder-实现跨进程通信在设计一个跨进程服务时应该注意些什么)
- [14. Android 系统中 AMS WMS PMS 的依赖关系是什么样的？](#14-android-系统中-ams-wms-pms-的依赖关系是什么样的)
- [15.  AOSP 中常用的命令](#15--aosp-中常用的命令)
  - [15.1. 编译](#151-编译)
  - [15.2. 系统信息](#152-系统信息)
  - [15.3. 文件](#153-文件)
- [16. AOSP 项目目录结构](#16-aosp-项目目录结构)
  - [16.1. 根目录](#161-根目录)
  - [16.2. frameworks/base 目录](#162-frameworksbase-目录)
- [17. AOSP 编译系统](#17-aosp-编译系统)
- [18. AMS WMS PMS 的依赖关系](#18-ams-wms-pms-的依赖关系)
- [19. Android 系统启动过程](#19-android-系统启动过程)

##  1. Handler 如何实现线程切换

- 创建 Handler 时制定要切换的线程，比如进行耗时操作后切换到主线程，那么创建 Handler 时 `val handler: Handler = Handler(Looper.getMainLooper())`，如果不指定 Looper 默认是当前线程。
- 耗时操作进行完之后，调用 `Handler#sendMessage` 方法，把消息发送到目标 Looper 的消息队列中。
- 消息队列会循环取出消息，调用消息的 `target#dispatchMessage` 方法（其实就是 Handler 的 dispatchMesage 方法，在这个方法中会将消息发送到指定线程的消息队列，从而实现线程切换）。如果 Message 本身有回调则执行，没有则执行 Handler 的回调方法。

> 一个线程维护一个 Looper，一个 Looper 维护一个消息队列

##  2. Android View 的绘制步骤？

在 Android 中，View 的绘制是通过以下步骤完成的：

1. 测量（Measure）：在测量阶段，View 会根据父容器传递的测量规格（MeasureSpec）计算自身的尺寸。每个 View 都有一个`onMeasure()`方法，用于测量自身的宽度和高度。在该方法中，View 根据测量规格和自身的特性（如布局参数）计算出自己的尺寸。

2. 布局（Layout）：在布局阶段，View 会根据测量得到的尺寸和父容器的布局规则，确定自己的位置。每个 View 都有一个`onLayout()`方法，用于设置自身的位置和大小。在该方法中，View 会根据测量结果和父容器的布局规则，计算自己在父容器中的位置。

3. 绘制（Draw）：在绘制阶段，View 会根据自身的尺寸和布局确定的位置，将自身内容绘制到屏幕上。每个 View 都有一个`onDraw()`方法，用于绘制自身的内容。在该方法中，View 可以通过 Canvas 对象进行绘制操作，如绘制背景、绘制文本、绘制图形等。

##  3. 系统层面 Android View 的绘制原理

在 Android 系统中，View 的绘制过程涉及到底层的图形系统和硬件加速技术。主要的流程如下：

1. View 树遍历：绘制过程从根 View 开始，通过递归遍历整个 View 树结构，对每个 View 执行绘制操作。

2. 视图测量（Measure）：在绘制之前，系统首先进行测量操作，计算每个 View 的尺寸。这是通过调用 View 的`measure()`方法实现的。在测量过程中，View 根据自身的布局参数（MeasureSpec）计算出自己的测量宽度和高度。

3. 视图布局（Layout）：测量完成后，系统执行布局操作，确定每个 View 在父容器中的位置。这是通过调用 View 的`layout()`方法实现的。在布局过程中，父容器会根据子 View 的测量结果和布局参数，计算每个子 View 的位置和大小。

4. 绘制到位图缓存：在绘制之前，系统会为每个 View 创建一个位图缓存，称为"Display List"。Display List 是一个存储绘制指令的数据结构，它包含了所有需要绘制的元素和操作。

5. 绘制操作（Draw）：在绘制过程中，系统将遍历 Display List 中的绘制指令，将绘制操作发送到底层的图形系统进行处理。底层图形系统会根据绘制指令，将图形和内容绘制到屏幕上。

6. 硬件加速：Android 系统还支持硬件加速技术，通过利用 GPU（图形处理器）来加速 View 的绘制过程。在使用硬件加速时，绘制操作将通过 OpenGL ES 进行处理，利用 GPU 的并行处理能力来加速图形渲染。

需要注意的是，以上流程是简化的描述，实际的绘制过程中还涉及到很多细节和优化，例如脏区域的处理、绘制缓存的使用等。Android 系统通过底层的图形系统和硬件加速技术，实现了高效的 View 绘制和界面渲染，以提供流畅的用户体验。

##  4. Android 应用中点击事件是如何在 View 之间传递的？

在 Android 中，View 的点击事件传递是通过触摸事件（Touch Event）来实现的。当用户触摸屏幕时，系统会将触摸事件传递给应用程序，并通过一系列的步骤将点击事件传递给对应的 View。以下是点击事件传递的一般流程：

1. 用户触摸屏幕时，系统将触摸事件包装成 MotionEvent 对象，并传递给当前活动的窗口。

2. 窗口会将触摸事件传递给顶级 ViewGroup（通常是 DecorView），即应用程序窗口的根 View。

3. 顶级 ViewGroup 会按照绘制层级的顺序遍历其子 View，检查触摸事件是否落在子 View 的区域内。

4. 如果触摸事件命中了某个子 View，该子 View 将成为事件的目标 View，并开始处理触摸事件。

5. 目标 View 会依次执行以下方法来处理触摸事件：onTouchEvent()、onInterceptTouchEvent() 和 onTouchListener 的回调。

   - onTouchEvent() 方法：目标 View 会首先调用自身的 onTouchEvent() 方法来处理触摸事件。在该方法中，可以根据事件类型（如 ACTION_DOWN、ACTION_MOVE、ACTION_UP 等）执行相应的逻辑。

   - onInterceptTouchEvent() 方法：如果目标 View 是一个 ViewGroup，并且在其内部还有子 View，则目标 View 可以通过重写 onInterceptTouchEvent() 方法来决定是否拦截触摸事件。如果拦截了事件，那么该 ViewGroup 会成为新的目标 View，负责处理后续的触摸事件。

   - onTouchListener 回调：如果目标 View 设置了 OnTouchListener，系统会在 onTouchEvent() 之前调用 OnTouchListener 的 onTouch() 方法，以便开发者可以对触摸事件进行自定义处理。

6. 如果目标 View 处理完触摸事件后返回了 true，表示事件已被消费，触摸事件的传递停止。如果返回了 false，表示该 View 不处理该事件，系统会继续向父容器传递触摸事件。

7. 触摸事件会继续向父容器的上层 View 传递，重复上述步骤，直到事件被某个 View 消费或传递到顶级 ViewGroup。

8. 如果触摸事件传递到顶级 ViewGroup 仍未被消费，则系统会将该事件传递给应用程序窗口的回调方法（如 Activity 的 onTouchEvent() 方法）进行处理。

通过以上的点击事件传递流程，Android 系统可以根据触摸事件的坐标和 View 的层级关系，将点击事件传递给合适的 View，并让其处理相应的点击逻辑。这样可以实现在用户界面中的点击交互效果。

##  5. 为什么 Android 组件需要在 AndroidManifest.xml 文件中声明？

Activity 在 AndroidManifest.xml 文件中进行声明是为了告知系统该 Activity 的存在，管理其生命周期，定义导航关系，以及进行权限控制。这样，系统才能够正确地启动、管理和保护应用程序中的 Activity 组件。

##  6. Android 开发中有哪些线程安全的数据结构？

在 Android 开发中，以下是一些线程安全的数据结构：

1. ConcurrentHashMap：它是一种线程安全的哈希表，适用于多线程环境下的高并发操作。它提供了对并发读写的支持，通过分段锁（Segment）来实现高效的并发性能。

2. CopyOnWriteArrayList：它是一个线程安全的 ArrayList 实现，适用于读操作远远多于写操作的场景。它通过对写操作进行复制（copy-on-write）来实现线程安全。

3. ConcurrentLinkedQueue：它是一个线程安全的无界非阻塞队列，适用于多线程环境下的高效并发操作。它采用了无锁的 CAS（Compare-and-Swap）操作来实现高性能的并发访问。

4. BlockingQueue：它是一个支持阻塞操作的线程安全队列，提供了可靠的线程间通信机制。常见的实现包括 ArrayBlockingQueue、LinkedBlockingQueue 等。

5. Atomic 类：Java.util.concurrent.atomic 包中提供了一系列原子类，如 AtomicInteger、AtomicLong 等。它们提供了基于 CAS 操作的原子性操作，用于对单个变量进行线程安全的读写操作。

6. SynchronizedList、SynchronizedSet、SynchronizedMap：这些类是通过在每个方法上添加 synchronized 关键字实现线程安全的包装器类，可以将非线程安全的 List、Set 和 Map 转化为线程安全的。

除了上述提到的数据结构，还有一些其他的线程安全的数据结构，如 ConcurrentSkipListMap、ConcurrentSkipListSet、LinkedBlockingDeque 等，它们在特定的场景下提供了线程安全的操作。

需要注意的是，尽管这些数据结构是线程安全的，但在并发编程中仍需注意正确的使用方式，包括合理的锁机制、操作顺序等，以避免潜在的问题，如死锁、竞态条件等。

##  7. 避免线程死锁

线程死锁是指两个或多个线程在执行过程中互相持有对方所需的资源，导致彼此无法继续执行的情况。为了避免线程死锁，可以采取以下几个策略：

1. 避免嵌套锁：在设计程序时，尽量避免多个锁的嵌套使用。如果多个线程需要获取多个锁，尝试按照相同的顺序获取锁，以减少死锁的可能性。

2. 使用定时锁和尝试锁：在获取锁时，可以使用定时锁（tryLock() 方法）和尝试锁（tryLock(timeout) 方法）来避免线程长时间等待锁的释放而导致死锁。这些方法可以在一定时间内尝试获取锁，如果获取不到则放弃或执行其他逻辑。

3. 减少锁的持有时间：尽量减少锁的持有时间，避免在持有锁的同时执行长时间的操作，这样可以减少其他线程等待所需资源的时间，降低死锁的风险。

4. 避免循环依赖：当多个线程之间存在循环依赖关系时，容易导致死锁。可以通过打破循环依赖或者调整资源申请的顺序来避免死锁。

5. 使用资源分配顺序：确定一个资源分配的顺序，并按照相同的顺序申请和释放资源，可以避免循环等待资源的情况，从而减少死锁的发生。

6. 使用并发库：Java 提供了一些并发库，如 java.util.concurrent 包中的工具类，可以帮助简化多线程编程，并提供了一些避免死锁的机制，如 ReentrantLock 类的公平锁和 Condition 接口的使用。

7. 使用工具进行检测：使用一些工具和技术，如死锁检测工具（如 jstack、jconsole）或静态代码分析工具（如 FindBugs、Lint），可以帮助检测潜在的死锁问题，并及时发现和解决。

总的来说，避免线程死锁需要谨慎设计和编写多线程程序，遵循一些约定和原则，并使用合适的工具和技术进行辅助。







##  8. 什么是线程安全？

线程安全是指在多线程环境下，对共享资源的访问和操作不会产生不正确的结果或导致不确定的行为。当多个线程同时访问共享资源时，线程安全确保每个线程都能正确地执行其操作，而不会干扰其他线程的操作或导致数据不一致或破坏。

在线程安全的环境中，各个线程之间的执行顺序和并发访问的方式不会影响程序的正确性。无论线程的调度顺序如何，最终的结果都是一致和可预测的。

##  9. 如何保证线程安全？
在 Android 开发中，确保线程安全非常重要，可以采取以下几种方法来实现线程安全：

1. 使用同步关键字（synchronized）：使用`synchronized`关键字来同步对共享资源的访问。可以使用`synchronized`关键字修饰方法或代码块，以确保同一时间只有一个线程可以访问共享资源。

2. 使用互斥锁（Lock）：通过使用 Lock 接口及其实现类（如 ReentrantLock）来实现线程安全。可以使用 Lock 的`lock()`和`unlock()`方法来控制对共享资源的访问。

3. 使用线程安全的集合类：Android 提供了一些线程安全的集合类，如`ConcurrentHashMap`、`CopyOnWriteArrayList`等。使用这些线程安全的集合类来存储和操作共享数据，可以保证多线程环境下的安全性。

4. 使用原子类（Atomic classes）：原子类提供了一些原子操作，可以在多线程环境中保证操作的原子性。例如，使用`AtomicInteger`来保证对整型变量的原子操作。

5. 使用线程安全的消息处理机制：Android 中的`Handler`和`Looper`机制可以用于跨线程通信。通过将消息发送到 Handler，然后在目标线程中处理消息，可以实现线程安全的消息传递。

6. 使用线程池（ThreadPoolExecutor）：使用线程池来管理线程的执行。通过使用线程池，可以控制线程的并发数量，并提供线程安全的执行环境。

7. 避免共享可变状态：尽量避免多个线程之间共享可变状态，尽量将状态封装在对象内部，并通过对象的方法进行访问和修改。这可以减少对共享资源的竞争和并发访问的问题。

8. 使用线程安全的设计模式：使用线程安全的设计模式，如单例模式中的双重检查锁定（double-checked locking）来确保只有一个线程可以创建对象实例。

9. 避免阻塞操作：尽量避免在主线程中进行长时间的阻塞操作，以避免应用界面的卡顿和响应性问题。可以使用异步任务（AsyncTask）、Handler 等机制来将耗时的操作移至后台线程。

10. 使用线程安全的库和框架：选择使用经过测试和验证的线程安全的第三方库和框架，以减少自身的线程安全问题。

总之，实现线程安全需要综合考虑多种因素，并根据具体的应用场景选择适当的线程安全机制。同时，注意避免死锁、竞态条件等常见的线程安全问题，并进行充分的测试

##  10. Java 中 synchronized 和 volatile 的区别和用法？

`synchronized`和`volatile`是 Java 中用于处理多线程并发访问的关键字，它们有不同的作用和用法：

1. `synchronized`：
   - 作用：`synchronized`用于实现线程安全，确保共享资源的同步访问。它提供了互斥性和可见性。
   - 用法：
     - `synchronized`可以用于修饰方法或代码块。当方法或代码块被`synchronized`修饰时，同一时间只有一个线程可以执行被修饰的代码。
     - `synchronized`还可以用于修饰静态方法和实例方法，用于控制对静态和实例方法的并发访问。
     - `synchronized`还可以使用锁对象（如`synchronized(obj)`）来实现更细粒度的同步控制。

2. `volatile`：
   - 作用：`volatile`用于保证可见性，即当一个线程修改了`volatile`变量的值，其他线程能够立即看到最新的值。
   - 用法：
     - `volatile`可以用于修饰变量，确保变量的读取和写入操作都直接在主内存中进行，而不使用线程的本地缓存。这样可以避免了线程之间的数据不一致性问题。
     - `volatile`不能像`synchronized`那样提供互斥性，不能保证原子性操作。

区别和适用场景：
- `synchronized`适用于保护临界区，确保同一时间只有一个线程可以执行被修饰的代码，提供了互斥性和可见性。它适合于对共享资源的复杂操作和保护。
- `volatile`适用于保证变量的可见性，即当一个线程修改了`volatile`变量的值，其他线程能够立即看到最新的值。它适合于简单的状态标志、状态切换等场景，不涉及复杂的原子操作。

需要注意的是，虽然`volatile`可以提供可见性，但并不能解决所有的线程安全问题。对于复合操作（例如`i++`）等需要原子性的操作，仍需要使用`synchronized`或其他原子类（如`AtomicInteger`）来保证线程安全。

综上所述，`synchronized`和`volatile`在多线程环境下有不同的用途和功能，可以根据具体的需求选择合适的关键字来保证线程安全和可见性。

## 11. lock 和 synchronized 的区别
Java 中的 `lock` 和 `synchronized` 都是用于实现多线程同步的机制，但它们之间存在一些区别。

1. 语法和使用方式：`synchronized` 是 Java 语言提供的关键字，可以直接用于方法或代码块的修饰。而 `lock` 是一个接口 `java.util.concurrent.locks.Lock` 的实现类，需要通过调用其方法来获取锁和释放锁。

2. 锁的获取方式：`synchronized` 在获取锁时，是隐式地由 JVM 自动进行管理的，当线程进入 `synchronized` 修饰的代码块时，会自动获取锁；当线程退出 `synchronized` 修饰的代码块时，会自动释放锁。而 `lock` 需要显式地调用 `lock()` 方法来获取锁，且需要在合适的时机调用 `unlock()` 方法来释放锁。

3. 粒度：`synchronized` 关键字的锁粒度较粗，一次只能对一个代码块进行同步。而 `lock` 接口提供了更细粒度的控制，可以在代码中灵活地获取和释放锁，可以实现更复杂的同步需求。

4. 可中断性：`lock` 接口提供了更灵活的可中断性。当一个线程等待获取 `lock` 锁时，可以根据需要选择是否允许中断该线程，而 `synchronized` 则没有提供类似的机制。

5. 条件变量支持：`lock` 接口提供了条件变量（Condition）的支持，可以通过条件变量实现更复杂的线程通信和协作。而 `synchronized` 没有直接提供条件变量的机制，需要通过 `wait()`、`notify()` 和 `notifyAll()` 等方法结合 `synchronized` 关键字来实现。

总的来说，`synchronized` 是 Java 语言内置的同步机制，使用起来相对简单，适用于一些简单的同步需求。而 `lock` 接口则提供了更灵活、细粒度的锁控制，适用于一些复杂的同步场景，并提供了更多的特性，如可中断性和条件变量支持。在使用时可以根据具体的需求选择合适的机制。

##  12. 从 Android 系统层面说明 Activity 的启动过程？

从 Android 系统层面来看，Activity 的启动过程涉及以下关键步骤和组件之间的协作：

1. ActivityManagerService 的处理：ActivityManagerService 是 Android 系统中负责管理 Activity 的核心服务。当应用程序通过`startActivity()`方法启动一个新的 Activity 时，该请求会发送到 ActivityManagerService。

2. 校验权限和启动请求：ActivityManagerService 首先会检查启动新 Activity 的应用程序是否具有适当的权限。如果权限验证通过，ActivityManagerService 会启动新的 Activity 实例。

3. 创建 ActivityRecord 和 TaskRecord：ActivityManagerService 创建一个 ActivityRecord 对象来表示要启动的 Activity，并创建一个 TaskRecord 对象来管理相关的任务栈。

4. 调用 AMS 的 startProcessLocked 方法：ActivityManagerService 的 startProcessLocked 方法负责启动应用程序的进程。如果应用程序的进程尚未运行，则会创建一个新的进程。

5. 创建 Application 和 Context 对象：当应用程序进程启动后，系统会为其创建一个 Application 对象，并为每个 Activity 创建一个 Context 对象。

6. 创建 Activity 实例：应用程序进程中的 Zygote 进程会被 fork 出来，并通过应用程序的 ClassLoader 加载 Activity 类，并通过反射创建 Activity 实例。

7. 调用 Activity 的生命周期方法：系统会依次调用新 Activity 的生命周期方法，包括`onCreate()`、`onStart()`、`onResume()`等。

8. 启动 Activity 的窗口：系统会为 Activity 分配一个窗口，并将其显示在屏幕上。这包括设置 Activity 的布局、加载视图和处理绘制等操作。

9. 返回结果给调用方：当新的 Activity 完全启动后，系统将结果返回给调用方，使其可以继续执行其他操作。

需要注意的是，以上是一个简化的概述，实际的 Activity 启动过程非常复杂，并涉及多个系统组件的交互和协作。在整个过程中，涉及到权限验证、进程管理、资源加载、生命周期回调等多个环节，系统会根据不同的配置和设置进行相应的处理。

## 13. Android 中通过 binder 实现跨进程通信，在设计一个跨进程服务时，应该注意些什么？

在设计一个跨进程服务时，你应该注意以下几点：

1. 接口设计：确保你的跨进程服务具有清晰的接口定义。定义良好的接口可以提高代码的可读性和可维护性，并降低后续版本的兼容性问题。接口设计应该考虑到数据传输的效率和安全性。

2. 线程安全：跨进程通信可能涉及多个线程的并发访问，因此你需要确保你的服务在处理跨进程请求时是线程安全的。使用适当的同步机制来保护共享数据，避免出现竞态条件和数据不一致的问题。

3. 异常处理：跨进程通信可能会出现各种异常情况，例如网络错误、超时等。你需要在设计中考虑到这些异常情况，并采取适当的异常处理机制，以确保服务的稳定性和可靠性。

4. 内存管理：跨进程通信涉及到数据的传输和共享，你需要注意内存管理的问题，避免内存泄漏和资源浪费。确保及时释放不再使用的资源，并考虑使用适当的内存优化技术，如对象池、内存缓存等。

5. 安全性：跨进程通信可能涉及敏感数据的传输，你需要确保通信的安全性。使用适当的加密算法和认证机制来保护数据的机密性和完整性，防止数据被篡改或窃取。

6. 性能优化：跨进程通信可能涉及到跨进程的数据传输和调用，因此性能是一个重要的考虑因素。你需要评估和优化数据传输的效率，并避免不必要的数据拷贝和调用开销。

7. 兼容性：跨进程服务的设计应该考虑到后续版本的兼容性。尽量避免接口的变更，或者提供适当的兼容性处理机制，以确保新版本的服务能够与旧版本的客户端兼容。

以上是设计一个跨进程服务时应该注意的一些方面。当然，具体的设计还会受到具体应用场景和需求的影响，因此需要根据实际情况进行调整和优化。

## 14. Android 系统中 AMS WMS PMS 的依赖关系是什么样的？

在 Android 系统中，AMS (Activity Manager Service)，WMS (Window Manager Service)，PMS (Package Manager Service) 是三个核心服务，它们之间存在一定的依赖关系。

1. AMS (Activity Manager Service): AMS 负责管理应用程序的生命周期、任务栈、Activity 之间的切换等。它负责启动、暂停、恢复和销毁应用程序的组件，以及处理用户与应用程序之间的交互。AMS 依赖于 WMS 和 PMS 来完成其任务。

2. WMS (Window Manager Service): WMS 负责管理应用程序的窗口，包括窗口的创建、显示、焦点切换、窗口的大小和位置等。它协调应用程序之间的窗口显示，处理用户的输入事件，并与 AMS 紧密合作以管理应用程序的生命周期。WMS 与 AMS 之间存在双向的依赖关系。

3. PMS (Package Manager Service): PMS 负责管理应用程序的安装、卸载、权限控制、应用程序组件的注册等。它维护了应用程序的清单文件信息，并提供了应用程序的相关信息给 AMS 和 WMS 使用。AMS 和 WMS 在启动应用程序时需要与 PMS 进行交互，以获取应用程序的相关信息。

总结来说，AMS 是整个 Android 系统中应用程序管理的核心服务，它依赖于 WMS 来管理应用程序的窗口显示，同时也依赖于 PMS 来获取应用程序的相关信息。WMS 则负责窗口的管理和显示，与 AMS 紧密合作以实现应用程序的生命周期管理。PMS 则负责应用程序的安装、权限控制和相关信息的管理，与 AMS 和 WMS 在应用程序启动和管理时进行交互。这三个服务之间的协作保证了 Android 系统的正常运行和应用程序的管理。

## 15.  AOSP 中常用的命令

### 15.1. 编译

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

### 15.2. 系统信息

`netstat -ap | grep 8080` : 查找进程占用

`ps|grep jack` : 查找进程 ID

`kill -9 PID` : 杀死进程

`ifconfig` : 查看 IP 信息

`free –m/-h` : 查看内存使用情况 @link

`df –h` : 显示磁盘使用情况 @link

### 15.3. 文件

文件查找

`find . -name "WebViewBrowserActivity.java"` : 查找 WebViewBrowserActivity.java 文件

文件内容查找

`find -type f -name '*.mk'|xargs grep 'Launcher3'` : 查找当前目录.mk 文件中 Launcher3 字符串

删除文件

`rm file`

`rm -r file/path` : 递归删除

`rm -rf file/path` : 强制递归删除

## 16. AOSP 项目目录结构

### 16.1. 根目录

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

### 16.2. frameworks/base 目录

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

##  17. AOSP 编译系统

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

![aosp build system](/assets/images/aosp_build_system.awebp)

## 18. AMS WMS PMS 的依赖关系
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

## 19. Android 系统启动过程

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
