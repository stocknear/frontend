<script lang="ts">
  import DashboardView from "$lib/components/Dashboard/DashboardView.svelte";

  export let data;
  export let form;
</script>

<DashboardView {data} {form} />
