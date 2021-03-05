const path = require("path");

function resolve(dir) {
  return path.resolve(__dirname, dir);
}
module.exports = {
  lintOnSave: process.env.NODE_ENV === "development",
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          javascriptEnabled: true // less 配置
        }
      }
    }
  },
  pages: {
    popup: {
      template: "public/browser-extension.html",
      entry: "./src/popup/main.js",
      title: "Popup"
    }
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: "src/background.js"
        }
      },
      manifestTransformer: manifest => {
        if (process.env.NODE_ENV === "development") {
          manifest.content_security_policy = manifest.content_security_policy.replace(
            "script-src",
            "script-src http://localhost:8098"
          );
        }

        return manifest;
      }
    }
  },
  chainWebpack: config => {
    config.plugins.delete("prefetch");
    config.resolve.alias
      .set("@images", resolve("src/assets/images"))
      .set("@components", resolve("src/components"))
      .set("@http", resolve("src/http"))
      .set("@router", resolve("src/router"))
      .set("@store", resolve("src/store"))
      .set("@styles", resolve("src/styles"))
      .set("@tools", resolve("src/tools"))
      .set("@views", resolve("src/views"));
  }
};
