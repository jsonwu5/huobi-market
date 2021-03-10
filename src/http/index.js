import axios from "axios";
import { message } from "ant-design-vue";

const $http = axios.create({
  baseURL: process.env.VUE_APP_BASEURL,
  timeout: 60000
});

function handleSuccess(data) {
  if (data.status === "ok") {
    return Promise.resolve(data);
  } else {
    message.error({
      content: data.message,
      key: "http-error"
    });
    return Promise.reject(data);
  }
}

// 请求错误处理函数
function handleError(error) {
  // 请求超时
  if (error.message.includes("timeout")) {
    if (error && error.response && error.response.config) {
      message.error({
        content: "请求超时，请稍后再试",
        key: "http-error"
      });
      return Promise.reject(JSON.parse(JSON.stringify(error)));
    }
  }

  setTimeout(() => {
    if (
      error &&
      error.response &&
      error.response.data &&
      error.response.data.error &&
      !error.response.data.error.handled &&
      !error.config.hideErrorMessage
    ) {
      message.error({
        content: error?.response?.data?.error?.message || "服务器异常",
        key: "http-error"
      });
    }
  }, 0);
  return Promise.reject(
    error && error.response && error.response.data && error.response.data.error
  );
}

$http.interceptors.request.use(config => {
  // 不显示进度条
  if (config.hideProgress) {
    return config;
  }

  return config;
});

$http.interceptors.response.use(
  response => {
    if (response.config.url.indexOf("chrome-extension://") !== -1) {
      return response.data;
    }
    return handleSuccess(response.data);
  },
  error => {
    console.log("error:", error);

    return handleError(error);
  }
);

export default $http;
