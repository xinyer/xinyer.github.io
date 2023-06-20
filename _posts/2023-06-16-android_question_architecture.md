---
title: Android 面试题 - 架构篇
date: 2023-06-16 10:41:00 +0800
categories: [Android]
tags: [面试题，架构]
---

- [1. Replugin 插件化框架基本原理](#1-replugin-插件化框架基本原理)

##  1. Replugin 插件化框架基本原理

- 如何 Hook ClassLoader？

在 `Application` 的 `attachBaseContext` 方法中调用 `PatchClassLoaderUtils.patch(application)` 方法。
	
```java
// 获取 mBase.mPackageInfo
// 1. ApplicationContext - Android 2.1
// 2. ContextImpl - Android 2.2 and higher
// 3. AppContextImpl - Android 2.2 and higher
Object oPackageInfo = ReflectUtils.readField(oBase, "mPackageInfo");

...

// 获取 mPackageInfo.mClassLoader
ClassLoader oClassLoader = (ClassLoader) ReflectUtils.readField(oPackageInfo, "mClassLoader");

...

// 外界可自定义 ClassLoader 的实现，但一定要基于 RePluginClassLoader 类
ClassLoader cl = RePlugin.getConfig().getCallbacks().createClassLoader(oClassLoader.getParent(), oClassLoader);

// 将新的 ClassLoader 写入 mPackageInfo.mClassLoader
ReflectUtils.writeField(oPackageInfo, "mClassLoader", cl);

```

通过反射的方法将 `ContextImpl.mPackageInfo.mClassLoader` 修改成框架的宿主使用的 `RepluginClassLoader` 。

- ClassLoader 的双亲委派模型
Android 中的类加载器包括：
	- BootClassLoader：这是最顶层的类加载器，它由虚拟机实现并负责加载 Java 核心类库，如 java.lang、java.util 等。它是用本地代码实现的，无法直接在应用程序中使用。
	- PathClassLoader：应用程序启动时创建的类加载器，用于加载应用程序中的类和资源，使得应用程序能够正常运行并访问自身定义的类和资源。
	- DexClassLoader：能够加载外部的 DEX 文件，并将其中的类和资源加载到应用程序的内存中。

创建一个 ClassLoader，需要使用一个已有的 ClassLoader 对象，作为新建的实例的 ParentLoader，如下代码：

```java
/**
 * Creates a {@code PathClassLoader} that operates on a given list of files
 * and directories. This method is equivalent to calling
 * {@link #PathClassLoader(String, String, ClassLoader)} with a
 * {@code null} value for the second argument (see description there).
 *
 * @param dexPath the list of jar/apk files containing classes and
 * resources, delimited by {@code File.pathSeparator}, which
 * defaults to {@code ":"} on Android
 * @param parent the parent class loader
 */
public PathClassLoader(String dexPath, ClassLoader parent) {
    super(dexPath, null, null, parent);
}
```

双亲委派模型基于以下原则：当一个类加载器收到加载类的请求时，它首先会委派给其父类加载器。如果父类加载器可以找到并加载该类，那么这个过程就完成了。只有在父类加载器无法加载该类的情况下，子类加载器才会尝试加载它。

- Replugin 中的 ClassLoader 如何实现加载插件中的类的？
RepluginClassloader: 宿主 ClassLoader 继承 PathClassLoader，重写 loadClass 方法，加载类时先从插件 PluginClassLoader 加载，加载不到载从自己的 loader 中加载。Hook 应用的 ClassLoader。
PluginClassLoader：插件 ClassLoader 继承 DexClassLoader，加载插件的类。

- Replugin 中如何启动插件 Activity？
?

- Replugin 中 如何加载插件中的资源？
？
