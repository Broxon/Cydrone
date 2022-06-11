<script>
let cydrone = "Kybernetický dron pro vzdálené hackování";
let typedChars = "";
let index = 0;
let typewriter;

const typeChar = () => {
if (index <cydrone.length) {
    typedChars += cydrone[index];
    index += 1;
} else {
    clearInterval(typewriter)
}
}

const typing = () => typewriter = setInterval(typeChar, 50)

typing ()
</script>

<section class="section" id="hero">
    <div class="container max-width">
        <div class="columns pb-5 is-multiline">
            <div class="column is-one-third">
                <div class="title is-1 has-text-white-bis is-size-2-mobile">
                    {typedChars}
                </div>
                <div
                    class="title is-5 has-text-white-bis mt-6 is-size-6-mobile"
                >
                    CyDrone disponuje širokou paletou nástrojů od rušiček
                    rádiové komunikace až k nočnímu vidění
                </div>
                <a href="#Our_solution">
                    <button
                        class="button is-active is-hovered is-medium is-rounded is-responsive is-fullwidth mt-6"
                        href="#Our_solution">ZJISTIT VÍCE</button
                    >
                </a>
            </div>
            <div class="column" id="image_drone">
                <figure class="image">
                    <img src="./assets/img/gallery/Dronik.png" alt="Drone" />
                </figure>
            </div>
        </div>
    </div>
</section>
<img src="./assets/img/background/wave.svg" alt="wave" />


<style>
    #hero {
        background: rgb(7, 2, 56);
        background: linear-gradient(180deg, rgba(7, 2, 56, 1) 0%);
        padding:6.5%;
    }


    @media only screen and (min-width: 600px) {
        .column {
            margin-top: 9em;
            margin-left: 5em;
            margin-right: 5em;
        }
    }

    @media only screen and (max-width:600px) {
        .column {
        margin-top: 7rem;
        margin-left: 2rem;
        margin-right: 2rem;
    }

    #image_drone {
        margin-left:0em;
        margin-right:1em;
    }
    
}
    .button:hover {
        background-color: hsl(217, 71%, 53%);
        border: none;
    }
    .button:active {
        background-color: hsl(217, 71%, 53%);
        border: none;
    }
</style>
