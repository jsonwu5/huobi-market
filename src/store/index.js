import Vue from "vue";
import Vuex from "vuex";
import $http from "@/http";

Vue.use(Vuex);

function getItem(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : undefined;
}

export default new Vuex.Store({
  state: {
    // 所有支持的币列表
    coinList: [],
    // 我的自选币种列表
    myCoinList: getItem("myCoinList") || [],
    // 行情表格展示的字段
    tableKeys: getItem("tableKeys") || [],
    // 置顶自选币种列表
    stickList: getItem("stickList") || [],
    // Manifest配置文件
    manifest: {}
  },
  mutations: {
    _setCoinList(state, val) {
      state.coinList = val;
    },
    _setMyCoinList(state, val) {
      state.myCoinList = val;
      localStorage.setItem("myCoinList", JSON.stringify(val));
    },
    _setTableKeys(state, val) {
      state.tableKeys = val;
      localStorage.setItem("tableKeys", JSON.stringify(val));
    },
    _setStickyList(state, val) {
      state.stickList = val;
      localStorage.setItem("stickList", JSON.stringify(val));
    },
    _setManifest(state, val) {
      state.manifest = val;
    }
  },
  actions: {
    // 获取火币支持的币种
    _getCoinList({ commit }) {
      $http.get("https://api.huobi.pro/v1/common/currencys").then(res => {
        commit("_setCoinList", res);
      });
    },
    // 获取当前的manifest.json配置
    _getManifest({ commit }) {
      // 通过API
      commit("_setManifest", chrome.runtime.getManifest());
      // 通过请求
      // $http.get(chrome.extension.getURL("manifest.json")).then(res => {
      //   commit("_setManifest", res);
      // });
    }
  },
  modules: {}
});
