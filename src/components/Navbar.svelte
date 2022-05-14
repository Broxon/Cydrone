<script>
    let mobile;
    const toggleNav = () =>{
    mobile = !mobile
  }
</script>

<nav class="navbar is-spaced is-transparent is-fixed-top" id="my-nav">
    <div class="container">
        <div class="navbar-brand">
            <a href="#/" class="navbar-item">
                <img class="cydrone" src="./assets/CyDrone.png" alt="#/" />
            </a>
            <a href="/" class="navbar-item is-size-5">
                CyDrone
            </a>
            <a class="navbar-burger" class:is-active={mobile} on:click={toggleNav} href="#/">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </a>
        </div>
        <div class="navbar-menu" class:is-active={mobile}>
            <div class="navbar-end">
                <div class="navbar-start">
                    <a class="navbar-item " href="/">
                    O nás 
                    </a>
                    <a class="navbar-item" href="/">
                    Partneři
                    </a>
                    <a class="navbar-item" href="/">
                    Naše řešení 
                    </a>
                    <a class="navbar-item" href="/">
                    Kontakt</a>
                </div>
            </div>
        </div>
    </div>
</nav>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@1,700&display=swap');
    a {
        font-family: 'Roboto Mono', monospace;
        font-weight: bold;
    }
</style>
