---
title: Java
date: 2023-06-13 12:10:00 +0800
categories: [Java]
tags: [Java]
---

- [1. 什么是闭包？](#1-什么是闭包)

## 1. 什么是闭包？

在 Java 中，闭包（Closure）是指一种函数对象，它可以捕获并绑定在其作用域之外定义的非局部变量。换句话说，闭包可以引用并操作其定义时所在的环境。

在传统的 Java 中，匿名内部类可以用作闭包的实现。通过定义一个匿名内部类并在其中引用外部变量，就可以创建一个具有访问外部变量能力的闭包。

以下是一个使用匿名内部类实现闭包的示例：

```java
public class ClosureExample {
    public static void main(String[] args) {
        int x = 10;

        Runnable closure = new Runnable() {
            @Override
            public void run() {
                System.out.println(x);  // 访问外部变量 x
            }
        };

        closure.run();  // 输出：10
    }
}
```

在上面的示例中，闭包 `closure` 引用了外部变量 `x`，并在其 `run()` 方法中访问了该变量。即使在 `main()` 方法执行完毕后，闭包仍然可以访问和操作外部变量的值。

Java 8 引入了 Lambda 表达式和函数式接口，使得闭包的实现更加简洁和直观。使用 Lambda 表达式，可以更方便地创建闭包。下面是使用 Lambda 表达式实现上述示例的简化版本：

```java
public class ClosureExample {
    public static void main(String[] args) {
        int x = 10;

        Runnable closure = () -> {
            System.out.println(x);  // 访问外部变量 x
        };

        closure.run();  // 输出：10
    }
}
```

通过 Lambda 表达式，我们可以直接在闭包中访问外部变量，而无需显式地声明为 `final`（Java 8 及更高版本中）。

总而言之，闭包是一种函数对象，它可以捕获并操作其定义时所在的环境中的变量。在 Java 中，可以使用匿名内部类或 Lambda 表达式来实现闭包的功能。闭包在函数式编程和并发编程中具有重要作用，可以简化代码，并提供更灵活的编程模式。

**闭包就是定义在函数内部的函数，或者闭包是能够访问函数局部变量的函数。**

