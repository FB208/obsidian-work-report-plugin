<script lang="ts">
    import { count } from './store';
    export let name: string;

    function increment() {
        count.update(n => n + 1);
    }
</script>

<div class="container">
    <h4>你好, {name}!</h4>
    <p>当前计数: {$count}</p>
    <button on:click={increment}>增加</button>
</div>

<style>
    .container {
        padding: 20px;
    }
    button {
        margin-top: 10px;
    }
</style>