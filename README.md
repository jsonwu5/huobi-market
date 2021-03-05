# 火币行情插件

## 本地运行

```shell
  npm install
  npm run serve
```

- 生成dist目录后
- 打开chrome浏览器，地址栏输入```chrome://extensions/```，回车。
- 右上角启用```开发者模式```
- 加载已解压的扩展程序
- 选择生成的dist目录文件夹


## 打包构建

- 更新package.json和manifest.json里的```version```版本号

```shell
  npm run build
```

- 根目录下会生成一个```artifacts```文件夹，里面打包出来zip可用作发布
