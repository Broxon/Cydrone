<section class="section" id="Partners">
  <div class="container">
    <div class="has-text-centered pb-6">
      <h2 class="title is-2">Partneři</h2>
      <h5 class="subtitle is-5 has-text-grey">Toto jsou naši partneři, bez kterých by tento projekt nemohl vzniknout</h5>
    </div>
    <div clas="pt-6" id="Partners-columns">
      <div class="columns">
        <div class="column is-3">
          <a href="https://ssps.cz" alt="#">
            <img src="/assets/img/partners/ssps_logo.svg" alt="logo_ssps" />
          </a>
        </div>
        <div class="column">
          <div class="box">
            <article class="media">
              <div class="media-left">
                <figure class="image is-64x64">
                  <!-- svelte-ignore a11y-img-redundant-alt -->
                  <img src="/assets/img/people/sablik.jpg" alt="Image" />
                </figure>
              </div>
              <div class="media-content">
                <div class="content">
                  <p>
                    <strong>Radko Sáblík</strong>
                    <small> <a href="https://twitter.com/RadkoSablik"> @RadkoSablik </a></small>
                    <br />
                    Myslím si, že projekt CyDrone vedený pod panem Waagem je ukázkou toho, jak může fungovat podpora středních škol mezi nadanými studenty.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
      <div class="columns">
        <div class="column is-3">
          <a href="https://haxagon.cz/" alt="#">
            <img src="/assets/img/partners/haxagon.svg" alt="logo_ssps" />
          </a>
        </div>
        <div class="column">
          <div class="box">
            <article class="media">
              <div class="media-left">
                <figure class="image is-64x64">
                  <!-- svelte-ignore a11y-img-redundant-alt -->
                  <img src="/assets/img/people/nathan.jpg" alt="Image" />
                </figure>
              </div>
              <div class="media-content">
                <div class="content">
                  <p>
                    <strong>Nathan Něměc</strong>
                    <small> <a href="https://twitter.com/nathannemec"> @NathanNemec </a></small>
                    <br />
                    Tento projekt mě nadchl už od počátku jeho vzniku, doufám, že budeme nadále ve velice úzké spolupráci se všemi členy CyDrone.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  #Partners-columns {
    background-color: #ffffff;
    opacity: 1;
    background-image: radial-gradient(rgba(7, 2, 56, 1) 0.9px, transparent 0.9px), radial-gradient(rgba(7, 2, 56, 1) 0.9px, #ffffff 0.9px);
    background-size: 36px 36px;
    background-position: 0 0, 18px 18px;
    padding-bottom: 8%;
  }

  @media only screen and (min-width: 600px) {
    .column {
      margin-top: 9em;
      margin-left: 5em;
      margin-right: 5em;
    }
  }

  @media only screen and (max-width: 600px) {
    .column {
      margin-top: 9rem;
      margin-left: 2rem;
      margin-right: 2rem;
    }
  }
</style>
