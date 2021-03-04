<template>
  <a-config-provider :locale="zhCN">
    <div class="app">
      <market />
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from "ant-design-vue/lib/locale-provider/zh_CN";
import Market from "@/components/market.vue";

export default {
  name: "App",
  components: { Market },
  data() {
    return {
      zhCN: zhCN
    };
  }
};
</script>

<style></style>
