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
    tableKeys: getItem("tableKeys") || []
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
    }
  },
  actions: {
    // 获取火币支持的币种
    _getCoinList({ commit }) {
      $http.get("https://api.huobi.pro/v1/common/currencys").then(res => {
        commit("_setCoinList", res);
      });
    }
  },
  modules: {}
});
