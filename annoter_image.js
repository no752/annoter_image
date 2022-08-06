(function() {

window.addEventListener("load", function() { 
"use strict";

/*  Pour sélectionner une partie de l'image à capturer, le seul moyen est d'inclure l'image dans un <CANVAS>.
    Celui-ci est simplement le tableau des pixels qui composent l'image.
    Par conséquent, les blocs de texte seront dessinés sur l'image. Cela implique que la taille de la police
    est mesurée en pixels. */
const 
tailleTexteDefaut = 16,  // la taille du texte par défaut en pixels
paddingTexte = 5,  // le padding des blocs de texte
facteurHauteurLigne = 1.5,  // hauteur d'une ligne = facteurHauteurLigne * tailleTexteDefaut px
epaisseurBordure = 2;  // l'épaisseur par défaut de la bordures des blocs de texte, en pixels

/*  Si les styles CSS sont issus d'une feuille externe alors la propriété document.styleSheets[0].cssRules ne renvoie
    pas les règles. Une solution est d'inclure les styles sont inclus dans la page html avec 
    <head>...<style> les styles </style>...</head>. Ma compréhension est que .cssRules ne fonctionne pas avec une feuille
    externe sur le domaine file:///. Donc, les styles sont gérés dans la page html. */ 
//document.body.style.fontSize = tailleTexteDefaut + "px";  // la taille par défaut du texte est défini sur <BODY>

creerCssDefaut();


function creerCssDefaut() {
    /*  Définit des styles par défaut en fonction des constantes du script. 
        La règle 0 définit les styles de <BODY>.
        La règle 3 définit les styles des blocs de texte <DIV>. */
    var css = document.styleSheets[0].cssRules;  // les règles de style
    css[0].styleMap.set("font-size", tailleTexteDefaut.toString() + "px");  // la taille par défaut du texte est défini sur <BODY>
    css[0].styleMap.set("line-height", facteurHauteurLigne);
    css[3].styleMap.set("padding", paddingTexte.toString() + "px");  // le padding des blocs de texte
}

// le navigateur a-t-il la permission de lire le presse-papier ?
navigator.permissions.query({ name: "clipboard-read" })
.then(
    function(result) {  // la permission existe
        if (result.state === "denied") {  // mais elle n'est pas accordée
            throw "Le navigateur n'a pas la permission de lire le presse-papier.";
        }
        
        navigator.clipboard.read()  // lire le contenu du presse-papier
        .then(  // l'utilisateur a autorisé la lecture
            function(contenuPP) {  // contenuPP : les éléments du presse-papier (array d'objets clipboardItem)
                if (contenuPP.length === 0) {
                    afficherErreur("Le presse-papier est vide.");
                }
                else if (contenuPP.length > 1) {
                    afficherErreur("Il y a plusieurs éléments dans le presse-papier.");
                }
                else {  // il y a 1 élément dans le presse-papier 
                    /*  Les types MIME d'une image :
                        https://www.iana.org/assignments/media-types/media-types.xhtml#image */
                    if (contenuPP[0].types[0].startsWith("image/")) {  // le type mime de l'élément indique une image
                        menuContextuel.creer();
                        collerImage(contenuPP[0]);
                    }
                    else {  // l'élément n'est pas une image
                        afficherErreur("Le presse-papier contient un élément qui n'est pas une image.");
                    }
                }
            }
        )
        .catch(  // l'utilisateur a refusé la lecture
            function(err) {
                afficherErreur("L'utilisateur a refusé la permission de lire le presse-papier :" + err);
            }
        );
    }
)
.catch( 
    function(err) {
        afficherErreur(err);
    }
);


function afficherErreur(err) {
    /*  Affiche le message d'erreur err. */
    let f = document.createDocumentFragment();
    f.append(document.createElement("H1"));
    f.children[0].append(document.createTextNode("Erreur"));
    f.append(document.createElement("P"));
    f.children[1].append(document.createTextNode(err));
    f.append(document.createElement("A"));
    f.children[2].append(document.createTextNode("Les navigateurs supportant l'API clipboard."));
    f.children[2].href = "https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API"; 
    f.children[2].target = "_blank";
    document.body.prepend(f);  // l'erreur est affichée dès le début du document (après <nody>)
}


const menuContextuel = {
    /*  Cet objet littéral englobe la gestion du menu contextuel. 
        Si le menu est ouvert avec un click-droit sur un bloc de texte alors les modifications de style vont s'appliquer
        à ce bloc de texte ; si le menu est ouvert avec un click-droit sur l'image alors les modifications vont
        s'appliquer à tous les blocs de texte. 
        Le menu est caché lorsque la souris le quitte. */
    
    blocTexte : null,  // l'élément représentant un bloc de texte auquel se rapporte le menu contextuel ouvert
    
    creer : function() {
        /*  Le menu contextuel est un élément <div> proposant les options pour modifier le style css d'un ou
            plusieurs blocs. L'id de cet élément <div> est : "menuContextuel". 
            Certains descendants du <div> ont un attribut data-modification-css dont la valeur est une fonction
            qui modifie un style. */
        let menu = document.createElement("DIV");
        menu.classList.add("menuContextuel");
        menu.classList.add("cacher");  // le menu contextuel toujours caché au départ
        menu.id = "menuContextuel";
        menu.addEventListener("mouseleave", menuContextuel.cacher);
        menu.addEventListener("click", menuContextuel.executerOption);
        // ajoute l'option pour modifier la taille du texte :
        let option = document.createElement("DIV");
        option.append("Taille du texte");
        let btn = document.createElement("BUTTON");
        btn.append("+");
        btn.dataset.type = "styleCSS";
        btn.dataset.action = "tailleTextePlus";
        option.append(btn);
        btn = document.createElement("BUTTON");
        btn.append("-");
        btn.dataset.type = "styleCSS";
        btn.dataset.action = "tailleTexteMoins";
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour modifier l'épaisseur du cadre :
        option = document.createElement("DIV");
        option.append("Epaisseur du cadre");
        btn = document.createElement("BUTTON");
        btn.append("+");
        btn.dataset.type = "styleCSS";
        btn.dataset.action = "epaisseurCadrePlus";
        option.append(btn);
        btn = document.createElement("BUTTON");
        btn.append("-");
        btn.dataset.type = "styleCSS";
        btn.dataset.action = "epaisseurCadreMoins";
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour modifier la couleur d'arrière-plan :
        option = document.createElement("DIV");
        option.append("Arrière-plan : ");
        btn = document.createElement("INPUT");
        btn.setAttribute("type", "color");
        btn.setAttribute("value", "#000000");
        btn.dataset.type = "styleCSS";
        btn.dataset.action = "couleurArrPlan";
        btn.addEventListener("input", menuContextuel.executerOption);  // evt input => chng couleur même si le sélecteur est ouvert
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour modifier la couleur du texte :
        option = document.createElement("DIV");
        option.append("Texte : ");
        btn = document.createElement("INPUT");
        btn.setAttribute("type", "color");
        btn.setAttribute("value", "#000000");
        btn.dataset.type = "styleCSS";
        btn.dataset.action = "couleurTexte";
        btn.addEventListener("input", menuContextuel.executerOption);  // evt input => chng couleur même si le sélecteur est ouvert
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour supprimer le bloc de texte :
        option = document.createElement("DIV");
        btn = document.createElement("BUTTON");
        btn.append("Supprimer le texte");
        btn.dataset.type = "styleCSS";
        btn.dataset.action = "supprTexte";
        option.append(btn);
        menu.append(option);
        // ajoute une ligne horizontale pour séparer les ensembles d'options :
        option = document.createElement("HR");
        menu.append(option);
        // ajoute l'option pour capture une partie de l'image (capture d'écran) :
        option = document.createElement("DIV");
        btn = document.createElement("BUTTON");
        btn.dataset.type = "captureEcran";
        btn.dataset.action = "creer";
        btn.append("Capture");
        option.append(btn);
        menu.append(option);      
        // ajoute le menu contextuel à la page :
        document.body.append(menu);
    },
    
    cacher : function(evt) {
        /*  La fonction est appelée par l'évènement "mouseleave" sur le menu contextuel pour cacher ce dernier. 
            evt.currentTarget est le menu contextuel sur lequel l'évènement a été enregistré. Cette propriété
            assure de changer la classe du menu contextuel. */
        evt.stopPropagation();
        evt.currentTarget.classList.replace("afficher", "cacher");
        menuContextuel.blocTexte = null;  // inutile de conserver le bloc de texte puisque le menu est fermé
    },

    afficher : function(evt) {
        /*  La fonction est appelée par l'évènement "contextmenu" sur un bloc de texte ou sur l'image.
            Le menu contextuel standard est remplacé par un menu permettant de modifier le style d'un ou 
            plusieurs blocs de texte. 
            L'évènement "contextmenu" se produit en un point de coordonnées (x,y) pour ouvrir le menu contextuel, qui 
            est représenté par un bloc <div>, où (x,y) sont les coordonnées du coin en haut à gauche. Le menu est caché 
            lorsque le pointeur de la souris le quitte. Ce mécanisme nécessite une précision de l'ordre du pixel. 
            Cependant, le menu est parfois caché immédiatement après son affichage, car le pointeur de la souris a bougé 
            involontairement. Pour être certain d'ouvrir le menu en incluant le pointeur de la souris, les coordonnées 
            du coin en haut à gauche sont (x - 10, y - 10). 
            Les propriétés window.scrollX et window.scrollY permettent de prendre en compte les scrolls qui ont eu lieu
            sur la page. */
        evt.preventDefault();  // le menu contextuel standard n'est pas affiché
        evt.stopPropagation();
        let menu = document.getElementById("menuContextuel");
        menu.classList.replace("cacher", "afficher");  // le menu est affiché
        let i = Math.round(evt.clientY + window.scrollY) - 10;
        menu.style.top = i > 0 ? i.toString() + "px" : "0px";  // fixe la position Y, qui ne doit pas être < 0
        i = Math.round(evt.clientX + window.scrollX) - 10;
        menu.style.left = i > 0 ? i.toString() + "px" : "0px";  // fixe la position X, qui ne doit pas être < 0
        if (evt.currentTarget.tagName !== "CANVAS") {  // le menu n'est pas ouvert depuis l'image
            menuContextuel.blocTexte = evt.currentTarget;  // donc il est ouvert depuis un bloc de texte, qui est enregistré
        }
    },
    
    executerOption : function(evt) {
        /*  Cette fonction est appelée par un "click" sur le menu contextuel pour exécuter l'option qui a été choisie.
            Les attributs data-<...> des boutons :
            L'attribut data-type identifie si l'action porte sur le texte ou sur la capture d'écran.
            L'attribut data-action de la cible est le nom de la fonction qui implémente une option.
            La gestion des styles :
            Le style est dans la propriété <bloc de texte>.style.<css>, où <css> est la propriété css. 
            Si elle est en plusieurs parties séparées par des '-', alors chacun est supprimé et la 1ère lettre
            de la partie suivante est en majuscule (exemple : "border-width" devient "borderWidth"). 
            
            Si menuContextuel.blocTexte = null alors le menu contextuel est ouvert mais il ne se rapporte
            pas à un bloc de texte en particulier ; par conséquent, les modifications vont s'appliquer à
            tous les blocs de texte. */
        evt.stopPropagation();
        switch (evt.target.dataset.type) {
            case "captureEcran":
                captureEcran[evt.target.dataset.action](evt);
                break;
                
            case "styleCSS":
                if (menuContextuel.blocTexte) {  // le menu se rapporte à un bloc de texte auquel s'applique les modifications
                    menuContextuel[evt.target.dataset.action](menuContextuel.blocTexte, evt);
                }
                else {  // le menu est ouvert depuis <img>, donc les modifications s'appliquent à tous les blocs de texte
                    for (let b of document.querySelectorAll(".blocTexte")) {  // b : un bloc de texte
                        menuContextuel[evt.target.dataset.action](b, evt);
                    }
                }
                break;
                
            default:
                break;
        }
    },
    
    tailleTextePlus : function(b) {
        /*  Incrémente de 2px la taille du texte du bloc b. */
        let t = Number.parseInt(b.style.fontSize);  // la taille actuelle du texte
        // si t = NaN alors la taille n'existe pas, donc t = 16 d'après le style font-size sur <body>
        b.style.fontSize = Number.isNaN(t) ? (tailleTexteDefaut + 2).toString() + "px" : (t + 2).toString() + "px";
    },
    
    tailleTexteMoins : function(b) {
        /*  Décrémente de 2px la taille du texte du bloc b. */
        let t = Number.parseInt(b.style.fontSize);  // la taille actuelle du texte
        /*  Si t = NaN alors la taille n'existe pas, donc t = 16 d'après le style font-size sur <body>.
            Par conséquent, la taille n'est pas décrémentée. */                
        if (!Number.isNaN(t) && t > tailleTexteDefaut) {  // la taille est décrémentée si elle est > 16
            b.style.fontSize = (t - 2).toString() + "px";
        }
    },
    
    epaisseurCadrePlus : function(b) {
        /*  La bordure du bloc b est incrémentée de 2px. 
            La propriété border-width est automatiquement remplacée par border-top-width, border-right-width,
            border-bottom-widht et border-left-width. */
        let t = Number.parseInt(b.style.borderWidth);  // l'épaisseur actuelle du cadre
        // si t = NaN alors l'épaisseur n'existe pas, donc t = 2
        b.style.borderWidth = Number.isNaN(t) ? epaisseurBordure.toString() + "px" : (t + epaisseurBordure).toString() + "px";  
    },
    
    epaisseurCadreMoins : function(b) {
        /*  La bordure du bloc b est décrémentée de epaisseurBordure px. */
        let t = Number.parseInt(b.style.borderWidth);  // l'épaisseur actuelle du cadre
        /*  Si t = NaN alors l'épaisseur n'existe pas, donc on suppose que t = 1px. */
        if (Number.isNaN(t)) {  // l'épaisseur devient égale à 0 ; donc, la bordure disparaît
            b.style.borderWidth = "0px";
        }
        else if (t >= epaisseurBordure) {  // la taille est décrémentée de epaisseurBordure px si elle est >= epaisseurBordure
            b.style.borderWidth = (t - epaisseurBordure).toString() + "px";
        }
    },
    
    couleurArrPlan : function(b, ...evt) {
        /*  La couleur d'arr-plan du bloc b devient c. evt[0] est l'objet représentant l'évènement. */
        b.style.backgroundColor = evt[0].target.value;
    },
    
    couleurTexte : function(b, ...evt) {
        /*  La couleur du texte du bloc b devient c. evt[0] est l'objet représentant l'évènement. */
        b.style.color = evt[0].target.value; 
    },
    
    supprTexte : function(b, ...evt) {
        /*  Supprime le bloc de texte b. evt[0] est l'objet représentant l'évènement. */
        b.remove();  // supprime le bloc de texte de la page
        b = null;  // inutile de conserver le bloc de texte puisqu'il va être supprimé
        evt[0].currentTarget.classList.replace("afficher", "cacher");  // le menu contextuel est caché
    }
}


const captureEcran = {
    /*  Que représentent "viewport", "layout viewport" et "visual viewport" ?
        Le "viewport" et le "layout viewport" sont équivalents.
        Le "viewport" inclut le document qui a été dessiné dans une fenêtre ou dans l'écran en mode plein écran.
        Le "visual viewport" est la partie visible du "viewport".
        Par défaut, la sélection de la zone à capturer est réalisée en mode plein écran. Néanmoins, l'utilisateur
        peut revenir à l'affichage dans une fenêtre avant de commencer la sélection.
        window.scrollX et window.scrollY mesurent le scroll en pixels dans le "viewport" (la mesure est de type float). */
    _selection : false,  // le rectangle pour border la zone à séléectioner est en cours de création 
    _rect : null,  // le bloc délimitant le rectangle à capturer
    _rectX : 0,  // l'abscisse du coin en haut à gauche
    _rectY : 0,  // l'ordonnée du coin en haut à gauche
    _rectW : 0,  // la largeur de la surface
    _rectH : 0,  // la hauteur de la surface
      
    creer : function() {
        /*  Initialise la capture d'écran en passant en plein écran si nécessaire. */
        if (document.fullscreenElement) {  // le mode pein écran est déjà actif
            captureEcran._creer();  // donc la capture commence
        }
        else {  // le mode plein écran n'est pas actif
            document.body.requestFullscreen()  // donc on l'active avant de commencer la capture d'écran
            .then(
                function() {
                    /*  Le mode plein écran est actif. */
                    captureEcran._creer();  // donc la capture commence
                }
            )
            .catch(
                function (err) {
                    console.log("impossible de passer en plein écran :", err.name, err.message);
                }
            );
        }
    },
    
    _creer : function() {
        /*  Prendre une copie de la partie qui a été sélectionnée sur l'écran.
            Ce dernier est en mode plein écran par défaut ; néanmoins, l'utilisateur peut revenir dans une fenêtre
            pour sélectionner la zone à capturer.
            Pour sélectionner la partie de l'écran à capturer dans un rectangle, les coordonnées du coin supérieur/gauche
            sont marquées par celles du 1er évènement "mousedown". En maintenant le bouton de la souris appuyé, le curseur
            est déplacé vers le coin inférieur/droit ; l'évènement "mousemove" renvoie les coordonnées du curseur pour tracer
            un rectangle temporaire avec le coin supérieur/gauche. Lorsque le bouton de la souris est relâché, l'évènement 
            "mouseup" est déclenché et ses coordonnées sont celles du coin inférieur/droit. 
            D'une part, cela implique l'interruption de l'écoute des évènements qui déplacent un bloc de texte.
            D'autre part, si ces évènements sont écoutés sur le rectangle alors la sélection risque d'être stoppée puisque 
            le curseur doit rester sur la bordure du rectangle ; par conséquent, l'écoute est réalisée sur <BODY> qui est 
            l'ascendant du rectangle.
            L'id du rectangle est "captureRect". 
            La sélection ne permet de faire défiler automatiquement l'écran pour étendre la zone à des parties invisibles. 
            Cela implique que le mode plein écran est activé avant la sélection.
            */
            
        // interrompt l'écoute des évènement "mousedown", "mousemove" et "mouseup" sur les blocs de texte :
        for (let b of document.querySelectorAll(".blocTexte")) {  // b : un bloc de texte
            b.removeEventListener("mousedown", deplacement.commencer);
            b.removeEventListener("mousemove", deplacement.poursuivre);
            b.removeEventListener("mouseup", deplacement.terminer);
        }
        // Remplace les blocs de texte en les dessinant dans le <CANVAS> :
        captureEcran._dessinerTexte();
        // écoute les évènement "mousedown", "mousemove" et "mouseup" sur <body> :
        document.body.addEventListener("mousedown", captureEcran._commencer);
        document.body.addEventListener("mousemove", captureEcran._selectionner);
        document.body.addEventListener("mouseup", captureEcran._terminer);
    },

    _commencer : function(evt) {
        /*  L'évènement "mousedown" marque le début de la création du rectangle qui définit la zone de l'image
            à capturer.. 
            Néanmoins, le click-droit (menu contextuel) déclenche les évènements "mousedown", puis "contextmenu". 
            Initialisation de captureEcran._rectX et captureEcran._rectY :
            Si le mode plein écran est actif alors window.scrollX et window.scrollY sont toujours nuls. Sinon, 
            l'écran est affiché dans une fenêtre ; dans ce cas, _rectX et _rectY doivent inclure le scroll. */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        if (evt.button === 2) {  // appel au menu contextuel avec la souris
            return;              // donc ce n'est pas le début de la création du rectangle
        }
        captureEcran._selection = true;  // marque le début de la sélection
        captureEcran._rectX = evt.clientX + window.scrollX;
        captureEcran._rectY = evt.clientY + window.scrollY;
        captureEcran._rect = document.createElement("DIV");
        captureEcran._rect.id = "captureRect";
//        captureEcran._rect.style.position = "fixed";
//        captureEcran._rect.style.border = "3px solid black";
        captureEcran._rect.style.left = captureEcran._rectX.toString() + "px";
        captureEcran._rect.style.top = captureEcran._rectY.toString() + "px";
        document.body.append(captureEcran._rect);
    },
    
    _selectionner : function(evt) {
        /*  La sélection continue avec l'évènement "mousemove". */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        if (captureEcran._selection) {  // la sélection a commencé
            captureEcran._rectW += evt.movementX;  // ajoute l'écart l'ancienne position en x, du pointeur de la souris
            captureEcran._rectH += evt.movementY;  // ajoute l'écart l'ancienne position en y, du pointeur de la souris
            captureEcran._rect.style.width = captureEcran._rectW.toString() + "px";
            captureEcran._rect.style.height = captureEcran._rectH.toString() + "px";
        }
    },
    
    _terminer : function(evt) {
        /*  L'évènement "mouseup" marque la fin de la création du rectangle qui sélectionne la partie de l'image
            à capturer. Cette dernière donne sa taille au <canvas>, puis remplace l'image précédente. 
            La capture est réalisée en mode plein écran (voir creer()) ; donc, on revient à l'écran "normal".
            On suppose que la partie de l'image sélectionnée est significative si sa surface est > à 100px^2 ; dans le cas
            contraire la capture est annulée.
            Important : 
            En redéfinissant la taille du canvas, l'ancienne image est effacée.
            La taille doit être redéfinie avant de copier la nouvelle image. */
        function reinit() {
            /* réinitialise les paramètres de la capture. */
            captureEcran._rect = null;
            captureEcran._rectX = 0;
            captureEcran._rectY = 0;
            captureEcran._rectW = 0;
            captureEcran._rectH = 0; 
        }
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement
        captureEcran._selection = false;  // marque la fin de la sélection
        // stoppe l'écoute des évènement "mousedown", "mousemove" et "mouseup" sur le <body> :
        document.body.removeEventListener("mousedown", captureEcran._commencer);
        document.body.removeEventListener("mousemove", captureEcran._selectionner);
        document.body.removeEventListener("mouseup", captureEcran._terminer);
        document.getElementById("captureRect").remove();  // le cadre représentant la surface est supprimé
        if (captureEcran._rectW * captureEcran._rectH > 100) {  // c'est un grand rectangle car la surface est > 100px^2
            // donc on remplace l'image du <canvas> par la sélection :
            let c = document.getElementById("canvas");
            let ctx = c.getContext("2d");
            let nvImg = ctx.getImageData(captureEcran._rectX, captureEcran._rectY, captureEcran._rectW, captureEcran._rectH);
            c.width = captureEcran._rectW;  // redéfinit la largeur du <canvas>
            c.height = captureEcran._rectH;  // redéfinit la hauteur du <canvas>
            ctx.putImageData(nvImg, 0, 0);  // la partie de l'image qui a été sélectionnée est mise dans le canvas
            reinit();
            captureEcran._copier();  // copie l'image dans le presse-papier
        }
        else {  // la capture a été annulée car c'est un petit rectangle
            reinit();
        }
        // quitte le mode plain écran :
        if (document.fullscreenElement) {  // le plein écran est actif
            document.exitFullscreen();     // donc on le quitte
        }
    },
    
    _copier : function(evt) {
        /*  L'image du canvas est copiée dans le presse-papier. */
        document.getElementById("canvas").toBlob(  // transforme le <CANVAS> en <IMG>
            function(blob) {
                let img = new ClipboardItem({ [blob.type] : blob });
                navigator.clipboard.write([img])
                /*  Il y aura une exception si le DOM n'a pas le focus ; cela se produit lorsque les outils de développement
                    sont ouverts avec une session de debug en même temps, par exemple.
                    Je ne parviens pas à rendre le focus au document dans le cas cité en exemple. 
                    L'exception ne se produit pas lorsque le panneau latéral est affiché. */
                .then(
                    function() {
                        /*  L'image est copiée dans le presse-papier. */
                    }
                )
                .catch(
                    function(err) {
                        afficherErreur("L'écriture dans le presse-papier a échoué : " + err.name + ", " + err.message);
                    }
                );
            }
        );
    },
    
    _dessinerTexte : function() {
        /*  Les blocs <div> de texte sont dessinés sur le <canvas>.
            1er cas : il y a une seule ligne de texte
            La propriété .textContent renvoie cette ligne
            2ème cas : il y a plusieurs lignes de texte
            Si le bloc de texte n'est pas assez large alors le saut de ligne est automatique, mais le texte est
            un seul élément texte ou <div>. A priori, la méthode fillText() prend en paramètre maxWidth, qui est la largeur
            max du texte et gère ainsi les sauts.
            Sinon, les sauts de ligne sont créés volontairement avec ENTREE. Dans ce cas, chaque ligne est un élément <div>.
            Bien sûr, ces 2 cas ne sont pas exclusifs.
            D'après mes tests, ce sont les 2 seuls cas. Cela impique que le bloc principal de texte n'a que des fils, qui
            sont des noeuds texte ou des éléments <div>. 
            
            Le bloc de texte est un élément <DIV> dont les coordonnées du coin en haut à gauche sont (x, y). Ce <DIV> a une
            largeur width et une hauteur height. La bordure est incluse dans ce bloc, qui a aussi une propriété padding.
            Dans le <CANVAS>, la bordure est dessinée autour d'un rectangle avec stokeRect() ; cela implique que :
            - Les coordonnées du coin en haut à gauche sont (x + <epaisseur bordure>, y + <épaisseur bordure>).
            - La largeur est (width - <épaisseur bordure>).
            - La hauteur est (height - <épaisseur bordure>).
            L'arrière-plan est ensuite coloré avec fillRect() qui représente un rectangle ayant les mêmes dimensions.
            
            Le padding est l'écart entre la bordure et le texte.
            Dans le DOM, la hauteur d'une ligne est : facteurHauteurLigne * <taille de la police>. Cette mesure n'est pas reproductible
            dans le <canvas> car fillText(texte, x, y) dessine 1 ligne de texte positionnée au dessus du point (x, y).
            Par conséquent, on doit calculer la hauteur de l'interligne :
            (facteurHauteurLigne * <taille de la police> - <taille de la police>) / 2.
            Cela implique que la 1ère ligne commence au point (x + <epaisseur bordure> + padding + interligne, 
            y + <épaisseur bordure> + padding).
            L'ordonnée des lignes suivantes est obtenue en ajoutant : <taille de la police> + interligne.
                      
            Notes : 
            rgba(0,0,0,0) = fond transparent
            La méthode fillText() dessine 1 ligne de texte même si le texte inclut des sauts de ligne.
            strokeRect(x, y, largeur, hauteur) : les bords sont autour du rectange, ils ne sont pas inclus dedans. 
            <contexte 2D du canvas>.lineWidth est l'épaisseur de la bordure des rectanges. D'après  la documentation, 
            cette propriété ignore la valeur 0 et la remplace toujours par 1. Cela implique que lorsque l'épaisseur de 
            la bordure est nulle, la bordure du rectangle ne doit pas être dessinée, sinon elle serait visible. 
            Toutes ces mesures sont modifiées avec le scroll horizontal et vertical. */
        var rect;  // rectangle représentant un bloc de texte ou une ligne de texte
        var ctx = document.getElementById("canvas").getContext("2d");
        var b, li, tt, texteY, eb, texteX; 
        ctx.strokeStyle = "black";  // le couleur de la bordure des blocs de texte
        for (b of document.querySelectorAll(".blocTexte")) {  // b : un bloc de texte
            rect = b.getBoundingClientRect();  // les coord et les dimensions du bloc principal de texte
            ctx.font = (b.style.fontSize) ? b.style.fontSize + " sans-serif" : 
            tailleTexteDefaut.toString() + "px sans-serif";  // taille du texte et police pour le <CANVAS>
            eb = Number.parseInt(b.style.borderTopWidth);  // l'épaisseur (1px par défaut)
            if (eb > 0) {  // la bordure existe
                ctx.lineWidth = eb;  // enreg l'épaisseur dans le contexte 2D du canvas
                ctx.strokeRect(rect.x + window.scrollX + eb, rect.y + window.scrollY + eb, rect.width - eb, 
                rect.height - eb);  // dessine les bords du rectangle            
            }  // sinon l'épaisseur est nulle (tt = 0) et ctx.lineWidth = 1 (valeur par défaut)
            ctx.fillStyle = (b.style.backgroundColor) ? b.style.backgroundColor : "rgba(0,0,0,0)";  // couleur d'arrière-plan
            ctx.fillRect(rect.x + window.scrollX + eb, rect.y + window.scrollY + eb, 
            rect.width - eb, rect.height - eb);  // dessine le rect et son arrière-plan
            ctx.fillStyle = (b.style.color) ? b.style.color : "black";  // la couleur du texte
            tt = (b.style.fontSize) ? Number.parseInt(b.style.fontSize) : tailleTexteDefaut;  // la taille du texte
            tt += Math.floor((tt * facteurHauteurLigne - tt) / 2);  // ajoute la hauteur de l'interligne 
            texteY = rect.y + window.scrollY + eb + paddingTexte + tt;  // l'ordonnée d'une ligne de texte
            texteX = rect.x + window.scrollX + eb + paddingTexte;  // l'abscisse des lignes du texte
            for (li of b.childNodes) {  // pour chaque ligne de texte
                ctx.fillText(li.textContent, texteX, texteY);
                texteY += tt;  // la prochaine ligne de texte sera écrite en dessous
            }
            b.remove();  // supprime le bloc de texte <div> du flux du document
        }
    }
}


function collerImage(imagePP) {
    /*  L'image du presse-papier (imagePP) est collée dans un <CANVAS>. */
    imagePP.getType(imagePP.types[0])  // imagePP.types[0] = type MIME des données du presse-papier
    .then(
        function(blob) {
            /*  blob : les données constituant l'image */
            createImageBitmap(blob)  // https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
            .then(
                function(bmp) {
                    /*  Le canvas doit avoir exactement la taille en pixels de l'image à coller, sinon elle est déformée :
                        https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage (i).
                    */
                    let c = document.createElement("CANVAS");  // le canvas qui va recevoir l'image du press-papier
                    c.id = "canvas";
                    c.width = bmp.width;  // voir (i)
                    c.height = bmp.height;  // voir (i)
                    c.getContext("2d").drawImage(bmp, 0, 0) ;
                    c.addEventListener("dblclick", ajouterTexte);
                    c.addEventListener("contextmenu", menuContextuel.afficher);
                    document.body.style.width = bmp.width.toString() + "px";
                    document.body.style.height = bmp.height.toString() + "px";
                    document.body.append(c);
                }
            )
            .catch(
                function(err) {
                    afficherErreur("Erreur avec createImageBitmap() :" + err);
                }
            );
                
        }
    )
    .catch(
        function(err) {
            afficherErreur("Impossible de coller l'image : " + err);
        }
    );
}


function ajouterTexte(evt) {
    /*  Cette fonction est appelée par un 2-click sur l'image pour ajouter un bloc <div> de texte. 
        Cliquer sur le bouton de la souris déclenche la séquence d'évènements :
        1. mousedown
        2. mouseup
        3. click
        Le déplacement des fenêtres est géré avec 3 évènements, dont l'ordre de déclenchement est :
        1. mousedown
        2. mousemove
        3. mouseup
        Pour chacun, la phase de bouillonement est inutile puisqu'ils sont déclarés sur l'élément <div>.
        Les coordonnées du coin en haut à gauche du <div> doivent tenir compte du scroll, qui aurait eu lieu sur la page. 
        Le bloc de texte est ajouté avant le bloc du menu contextuel. Ainsi, ce dernier est en surimpression sur
        les autres blocs. */
    evt.stopPropagation();
    let div = document.createElement("DIV");
    div.classList.add("blocTexte");  // la classe définit le positionnement
    div.style.top = Math.round(evt.pageY).toString() + "px";
    div.style.left = Math.round(evt.pageX).toString() + "px";
    div.style.border = "2px solid black";  // ajoute une bordure par défaut
    div.setAttribute("contenteditable", "true");
    div.addEventListener("mousedown", deplacement.commencer);
    div.addEventListener("mousemove", deplacement.poursuivre);
    div.addEventListener("mouseup", deplacement.terminer);
    div.addEventListener("mouseleave", deplacement.terminer);
    div.addEventListener("contextmenu", menuContextuel.afficher);
    document.getElementById("menuContextuel").before(div);
}


const deplacement = {  // groupe les fonctions qui gèrent le déplacement des blocs de texte
    /*  Un bloc de texte est un élément <div>. Déplacer cet élément revient à modifier les coordonnées 
        du coin en haut à gauche (x, y).
        Pour commencer le déplacement d'un bloc de texte, on clique dessus en un point ; puis, le déplacement 
        se poursuit en faisant glisser le pointeur. Cette action est captée par l'évènement "mousemove", dont 
        les propriétés "movementX" et "movementY" enregistrent les écarts avec l'abscisse et l'ordonnée précédentes 
        du pointeur.
        Donc, la nouvelle position du coin supérieur gauche est : (x + "movementX", y + "movementY").
        Les propriétés window.scrollX et window.scrollY permettent de prendre en compte les scrolls qui ont eu lieu
        sur la page. */
    _poursuite : false,  
    _x : 0,  // la valeur de la propriété "left" du coin supérieur gauche de <div>
    _y : 0,  // la valeur de la propriété "top" du coin supérieur gauche de <div>
    
    commencer : function(evt) {
        /*  Le déplacement commence avec l'évènement "mousedown". 
            Néanmoins, le click-droit (menu contextuel) déclenche les évènements "mousedown", puis "contextmenu". */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        if (evt.button === 2) {  // appel au menu contextuel avec la souris
            return;              // donc ce n'est pas le début du déplacement
        }
        deplacement._poursuite = true;  // marque le début du déplacement
        let rect = evt.currentTarget.getBoundingClientRect();  // les coord et les dim du bloc à déplacer
        deplacement._x = Math.round(rect.x + window.scrollX);
        deplacement._y = Math.round(rect.y + window.scrollY);
    },
    
    poursuivre : function(evt) {
        /*  Le déplacement continue avec l'évènement "mousemove". */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        if (deplacement._poursuite) {  // le déplacement a commencé
            deplacement._x += evt.movementX;  // ajoute l'écart l'ancienne position en x, du pointeur de la souris
            deplacement._y += evt.movementY;  // ajoute l'écart l'ancienne position en y, du pointeur de la souris
            evt.currentTarget.style.top = deplacement._y.toString() + "px";
            evt.currentTarget.style.left = deplacement._x.toString() + "px";
        }
    },
    
    terminer : function(evt) {
        /*  Le déplacement est terminé avec l'évènement "mouseup". */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        deplacement._poursuite = false;  // marque la fin du déplacement
    }
}

});  // appelée lorsque le chargement de la page est terminé

})();  // fin de la fonction globale exécutée au lancement de l'appli, pour créer une portée différente de la portée globale
