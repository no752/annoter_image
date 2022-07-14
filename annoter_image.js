(function() {

window.addEventListener("load", function() { 
"use strict";


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
                afficherErreur("L'utilisateur a refusé la permission de lire le presse-papier.");
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
    document.body.append(f);
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
            plusieurs blocs. L'id de cet élément <div> est : "menuContextuelTexte". 
            Certains descendants du <div> ont un attribut data-modification-css dont la valeur est une fonction
            qui modifie un style. */
        let menu = document.createElement("DIV");
        menu.classList.add("menuContextuelTexte");
        menu.classList.add("cacher");  // le menu contextuel toujours caché au départ
        menu.id = "menuContextuelTexte";
        menu.addEventListener("mouseleave", menuContextuel.cacher);
        menu.addEventListener("click", menuContextuel.modifierCSS);
        // ajoute l'option pour modifier la taille du texte :
        let option = document.createElement("DIV");
        option.append("Taille du texte");
        let btn = document.createElement("BUTTON");
        btn.append("+");
        btn.dataset.modificationCss = "tailleTextePlus";
        option.append(btn);
        btn = document.createElement("BUTTON");
        btn.append("-");
        btn.dataset.modificationCss = "tailleTexteMoins";
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour modifier l'épaisseur du cadre :
        option = document.createElement("DIV");
        option.append("Epaisseur du cadre");
        btn = document.createElement("BUTTON");
        btn.append("+");
        btn.dataset.modificationCss = "epaisseurCadrePlus";
        option.append(btn);
        btn = document.createElement("BUTTON");
        btn.append("-");
        btn.dataset.modificationCss = "epaisseurCadreMoins";
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour modifier la couleur d'arrière-plan :
        option = document.createElement("DIV");
        option.append("Arrière-plan : ");
        btn = document.createElement("INPUT");
        btn.setAttribute("type", "color");
        btn.setAttribute("value", "#000000");
        btn.dataset.modificationCss = "couleurArrPlan";
        btn.addEventListener("input", menuContextuel.modifierCSS);  // evt input => chng couleur même si le sélecteur est ouvert
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour modifier la couleur du texte :
        option = document.createElement("DIV");
        option.append("Texte : ");
        btn = document.createElement("INPUT");
        btn.setAttribute("type", "color");
        btn.setAttribute("value", "#000000");
        btn.dataset.modificationCss = "couleurTexte";
        btn.addEventListener("input", menuContextuel.modifierCSS);  // evt input => chng couleur même si le sélecteur est ouvert
        option.append(btn);
        menu.append(option);
        // ajoute l'option pour supprimer le bloc de texte :
        option = document.createElement("DIV");
        btn = document.createElement("BUTTON");
        btn.append("Supprimer le texte");
        btn.dataset.modificationCss = "supprTexte";
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
            est représenté par un bloc <div> où (x,y) sont les coordonnées du coin en haut à gauche. Le menu est caché 
            lorsque le pointeur de la souris le quitte. Ce mécanisme nécessite une précision de l'ordre du pixel. 
            Cependant, le menu est parfois caché immédiatement après son affichage, car le pointeur de la souris a bougé 
            involontairement. Pour être certain d'ouvrir le menu en incluant le pointeur de la souris, les coordonnées 
            du coin en haut à gauche sont (x - 10, y - 10). */
        evt.preventDefault();  // le menu contextuel standard n'est pas affiché
        evt.stopPropagation();
        let menu = document.getElementById("menuContextuelTexte");
        menu.classList.replace("cacher", "afficher");  // le menu est affiché
        let i = Math.round(evt.clientY + window.scrollY) - 10;
        menu.style.top = i > 0 ? i.toString() + "px" : "0px";  // fixe la position Y, qui ne doit pas être < 0
        i = Math.round(evt.clientX + window.scrollX) - 10;
        menu.style.left = i > 0 ? i.toString() + "px" : "0px";  // fixe la position X, qui ne doit pas être < 0
        if (evt.currentTarget.tagName !== "IMG") {  // le menu n'est pas ouvert depuis l'image
            menuContextuel.blocTexte = evt.currentTarget;  // donc il est ouvert depuis un bloc de texte, qui est enregistré
        }
    },
    
    modifierCSS : function(evt) {
        /*  Cette fonction est appelée par un "click" sur le menu contextuel pour modifier le CSS d'un ou plusieurs
            blocs de texte. 
            L'attribut data-modificationCss de la cible est le nom de la fonction qui définit la modification du CSS à appliquer.
            Le style est dans la propriété <bloc de texte>.style.<css>, où <css> est la propriété css. 
            Si elle est en plusieurs parties séparées par des '-', alors chacun est supprimé et la 1ère lettre
            de la partie suivante est en majuscule (exemple : "border-width" devient "borderWidth"). 
            Si menuContextuel.blocTexte = null alors le menu contextuel est ouvert mais il ne se rapporte
            pas à un bloc de texte en particulier ; par conséquent, les modifications vont s'appliquer à
            tous les blocs de texte. */
        evt.stopPropagation();
        if (menuContextuel.blocTexte) {  // le menu se rapporte à un bloc de texte auquel s'applique les modifications
            menuContextuel[evt.target.dataset.modificationCss](menuContextuel.blocTexte, evt);
        }
        else {  // le menu est ouvert depuis <img>, donc les modifications s'appliquent à tous les blocs de texte
            for (let b of document.querySelectorAll(".blocTexte")) {  // b : un bloc de texte
                menuContextuel[evt.target.dataset.modificationCss](b, evt);
            }
        }
    },
    
    tailleTextePlus : function(b) {
        /*  Incrémente de 1em la taille du texte du bloc b. */
        let t = Number.parseInt(b.style.fontSize);  // la taille actuelle du texte
        // si t = NaN alors la taille n'existe pas, donc t = 1 d'après le style font-size sur <body>
        b.style.fontSize = Number.isNaN(t) ? "2em" : (t + 1).toString() + "em";
    },
    
    tailleTexteMoins : function(b) {
        /*  Décrémente de 1em la taille du texte du bloc b. */
        let t = Number.parseInt(b.style.fontSize);  // la taille actuelle du texte
        /*  Si t = NaN alors la taille n'existe pas, donc t = 1 d'après le style font-size sur <body>.
            Par conséquent, la taille n'est pas décrémentée. */                
        if (!Number.isNaN(t) && t > 1) {  // la taille est décrémentée si elle est > 1
            b.style.fontSize = (t - 1).toString() + "em";
        }
    },
    
    epaisseurCadrePlus : function(b) {
        /*  La bordure du bloc b est incrémentée de 2px. */
        let t = Number.parseInt(b.style.borderWidth);  // l'épaisseur actuelle du cadre
        // si t = NaN alors l'épaisseur n'existe pas, donc t = 2
        b.style.borderWidth = Number.isNaN(t) ? "2px" : (t + 2).toString() + "px";  
    },
    
    epaisseurCadreMoins : function(b) {
        /*  La bordure du bloc b est décrémentée de 2px. */
        let t = Number.parseInt(b.style.borderWidth);  // l'épaisseur actuelle du cadre
        /*  Si t = NaN alors l'épaisseur n'existe pas, donc on suppose que t = 1px. */
        if (Number.isNaN(t)) {  // l'épaisseur devient égale à 0 ; donc, la bordure disparaît
            b.style.borderWidth = "0px";
        }
        else if (t >= 2) {  // la taille est décrémentée de 2px si elle est >= 2
            b.style.borderWidth = (t - 2).toString() + "px";
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


function collerImage(imagePP) {
    /*  L'image du presse-papier (imagePP) est collée dans un <img>. */
    imagePP.getType(imagePP.types[0])  // imagePP.types[0] = type MIME des données du presse-papier
    .then(
        function(blob) {
            let f = document.createDocumentFragment();
            f.append(document.createElement("IMG"));
            f.children[0].addEventListener("load", imageDispo);  // capte la fin du chargement de l'image
            f.children[0].src = URL.createObjectURL(blob);  // src = adr de l'image stockée par le navigateur
            document.body.append(f);
        }
    )
    .catch(
        function(err) {
            afficherErreur("Impossible de coller l'image : " + err);
        }
    )
}


function imageDispo(evt) {
    /*  La fonction est appelée par l'évènement "load" sur l'élément <img> ; c'est à dire, lorsque l'image 
        est disponible. */
    URL.revokeObjectURL(evt.target.src);  // libère l'image de la mémoire, car cette image va être modifiée
    evt.target.removeEventListener("load", imageDispo);  // suppr la gestion de l'évènement "load"
    evt.target.addEventListener("dblclick", ajouterTexte);
    evt.target.addEventListener("contextmenu", menuContextuel.afficher);
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
    div.classList.add("blocTexte");
    div.style.top = Math.round(evt.pageY).toString() + "px";
    div.style.left = Math.round(evt.pageX).toString() + "px";
    div.setAttribute("contenteditable", "true");
    div.addEventListener("mousedown", deplacement.commencer);
    div.addEventListener("mousemove", deplacement.poursuivre);
    div.addEventListener("mouseup", deplacement.terminer);
    div.addEventListener("mouseleave", deplacement.terminer);
    div.addEventListener("contextmenu", menuContextuel.afficher);
    document.getElementById("menuContextuelTexte").before(div);
}


const deplacement = {  // groupe les fonctions qui gèrent le déplacement des blocs de texte
    /*  Un bloc de texte de texte est un élément <div>. Déplacer cet élément revient à modifier les coordonnées 
        du coin en haut à gauche (x, y).
        Pour commencer le déplacement d'un bloc de texte, on clique dessus en un point ; puis, le déplacement 
        se poursuit en faisant glisser le pointeur. Cette action est captée par l'évènement "mousemove", dont 
        les propriétés "movementX" et "movementY" enregistrent les écarts avec l'abscisse et l'ordonnée précédentes 
        du pointeur.
        Donc, la nouvelle position du coin supérieur gauche est : (x + "movementX", y + "movementY"). */
    poursuite : false,  
    x : 0,  // la valeur de la propriété "left" du coin supérieur gauche de <div>
    y : 0,  // la valeur de la propriété "top" du coin supérieur gauche de <div>
    
    commencer : function(evt) {
        /*  Le déplacement commence avec l'évènement "mousedown". 
            Néanmoins, le click-droit (menu contextuel) déclenche les évènements "mousedown" puis "contextmenu". */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        if (evt.button === 2) {  // appel au menu contextuel avec la souris
            return;              // donc ce n'est pas le début du déplacement
        }
        deplacement.poursuite = true;  // marque le début du déplacement
        let rect = evt.currentTarget.getBoundingClientRect();  // les coord et les dim du bloc à déplacer
        deplacement.x = Math.round(rect.x + window.scrollX);
        deplacement.y = Math.round(rect.y + window.scrollY);
    },
    
    poursuivre : function(evt) {
        /*  Le déplacement continue avec l'évènement "mousemove". */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        if (deplacement.poursuite) {  // le déplacement a commencé
            deplacement.x += evt.movementX;  // ajoute l'écart l'ancienne position en x, du pointeur de la souris
            deplacement.y += evt.movementY;  // ajoute l'écart l'ancienne position en y, du pointeur de la souris
            evt.currentTarget.style.top = deplacement.y.toString() + "px";
            evt.currentTarget.style.left = deplacement.x.toString() + "px";
        }
    },
    
    terminer : function(evt) {
        /*  Le déplacement est terminé avec l'évènement "mouseup". */
        evt.stopPropagation();  // inutile de propager l'évènement de déplacement, puisqu'il ne concerne que le bloc de texte
        deplacement.poursuite = false;  // marque la fin du déplacement
    }
}

});  // appelée lorsque le chargement de la page est terminé

})();  // fin de la fonction globale exécutée au lancement de l'appli, pour créer une portée différente de la portée globale
