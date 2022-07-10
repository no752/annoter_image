# Introduction
Le but est de coller une image dans un page html pour positionner des blocs de texte représentant des annotations. Un outil externe peut ensuite prendre une copie d'écran de l'image annotée.
# Comment utiliser l'application ?
L'image est immédiatement collée à l'ouverture de l'application, en supposant que l'utilisateur accorde la permission.
Un click double sur l'image permet de créer une bloc de texte de couleur noire, avec une bordure de la même couleur.
Un click-droit sur un bloc de texte ouvre un menu contextuel pour augmenter ou diminuer la taille du texte et l'épaisseur de la bordure ; pour modifier la couleur de l'arrierè-plan et du texte ; et finalement, la dernière option supprime le bloc.
Un click-droit sur l'image ouvre le même menu contextuel pour permettre d'appliquer les modifications du style à tous les blocs de texte.
Par ailleurs si l'onglet est dupliqué, alors l'application s'ouvre dans un nouvel onglet, en important une autre image du presse-papier.
# Quelles sont les autorisations nécessaires ?
Le point de départ est une image contenue dans le presse-papier.
Cela implique que le script doit pouvoir accéder au presse-papier ; c'est impossible avec firefox :
https://developer.mozilla.org/fr/docs/Web/API/Clipboard.
D'après cette page, l'accès au presse-papier est supporté par chrome et edge seulement.
# Installation
Il suffit d'enregistrer les fichiers annoter_image.html, annoter_image.css et annoter_image.js dans le même dossier ; puis, d'ouvrir le premier fichier dans un la dernière version de edge ou chrome.
# Note
Il n’est donné absolument aucune garantie quant au bon fonctionnement.
