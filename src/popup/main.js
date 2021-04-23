import Vue from "vue";
import store from "@/store";
import App from "./App.vue";
import Antd from "ant-design-vue";
import $http from "@/http";
import filters from "@/tools/filters";
import "../styles/style.less";
import VueDraggableResizable from "vue-draggable-resizable";
import { getStorage } from "@/tools/storage.js";

Vue.component("vue-draggable-resizable", VueDraggableResizable);

Vue.config.productionTip = false;
Vue.config.devtools = process.env.NODE_ENV === "development";

// 注册插件
Vue.use(Antd);

// 注册全局过滤器
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]));

// 全局属性
Vue.prototype.$http = $http;
// 方便在控制台查看缓存里的数据
window.getStorage = getStorage;

new Vue({
  store,
  el: "#app",
  render: h => h(App)
});
