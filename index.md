## WRITING, READING, TRANSLATE

- Record technical drips, Find good articles, To improve myself and all 

----

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>