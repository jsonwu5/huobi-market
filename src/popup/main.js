import Vue from "vue";
import store from "@/store";
import App from "./App.vue";
import Antd from "ant-design-vue";
import $http from "@/http";
import filters from "@/tools/filters";
import "../styles/style.less";
import VueDraggableResizable from "vue-draggable-resizable";
// 分片存储，解决单个storage item不能超过8kb的问题
import "chrome-storage-largesync/dist/chrome-Storage-largeSync.js";

Vue.component("vue-draggable-resizable", VueDraggableResizable);

Vue.config.productionTip = false;
Vue.config.devtools = process.env.NODE_ENV === "development";

// 注册插件
Vue.use(Antd);

// 注册全局过滤器
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]));

// 全局属性iye
Vue.prototype.$http = $http;

new Vue({
  store,
  el: "#app",
  render: h => h(App)
});
