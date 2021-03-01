import Vue from "vue";
import App from "./App.vue";
import Antd from "ant-design-vue";
import $http from "@/http";
import filters from "@/tools/filters";
import "../styles/style.less";

// 注册插件
Vue.use(Antd);

// 注册全局过滤器
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]));

// 全局属性
Vue.prototype.$http = $http;

/* eslint-disable no-new */
new Vue({
  el: "#app",
  render: h => h(App)
});
