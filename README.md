# Introduction
Le but est de coller une image dans un page html pour positionner des blocs de texte représentant des annotations. Une partie de l'image est ensuite sélectionnée pour être placée dans le presse-papier afin d'être collée dans une autre application.
# Comment utiliser l'application ?
1. Placer une image dans le presse-papier avec la touche "Impr écran".
2. Ouvrir l'application : l'image est immédiatement collée en accordant l'autorisation.
3. Créer des blocs de texte sur l'image en double cliquant.
4. Ces blocs sont déplaçables avec un glisser/déposer.
5. Un click-droit sur un bloc ouvre un menu contextuel pour modifier le style du texte.
6. Un click-droit sur l'image ouvre le même menu contextuel pour modifier le style du texte de tous les blocs.
7. La dernière option du menu lance la sélection manuelle d'une partie de l'image en traçant un rectangle à la souris ; à la fin de l'opération, cette portion de l'image est automatiquement affichée et copiée dans le presse-papier.
8. L'image est ensuite collée dans un autre logiciel, comme un traitement de texte par exemple.

A l'étape 2), si l'application est déjà ouverte dans un onglet, alors il est possible de le dupliquer pour obtenir le même comportement.
Le menu contextuel permet d'augmenter ou de diminuer la taille du texte et l'épaisseur de la bordure, de modifier la couleur de l'arrière-plan et du texte, de supprimer le bloc.
La dernière option sélectionne et copie une partie de l'image dans le presse-papier.
# Quelles sont les autorisations nécessaires ?
Le point de départ est une image contenue dans le presse-papier.
Cela implique que le script doit pouvoir accéder au presse-papier ; c'est impossible avec firefox :
https://developer.mozilla.org/fr/docs/Web/API/Clipboard.
D'après cette page, l'accès au presse-papier est supporté par chrome et edge seulement.
# Installation
Il suffit d'enregistrer les fichiers annoter_image.html et annoter_image.js dans le même dossier ; puis, d'ouvrir le premier fichier avec la dernière version de edge ou chrome.
# Note
Il n’est donné absolument aucune garantie quant au bon fonctionnement.
