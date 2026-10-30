# 🃏 Tarot du Club — maquettes du MVP

Application mobile de tarot français (projet en cadrage) — règles officielles FFT.

## Tester la maquette

👉 **Ouvrir `index.html`** (MVP V1.2 — tables à 3, 4 et 5 joueurs contre des bots, hors-ligne, avec une première version du mode **Duplicate** 🏆 et plusieurs profils par appareil).

Publié via GitHub Pages : <https://doob-dofus.github.io/tarot/>

## Versions

| Version | Fichier | Contenu |
| --- | --- | --- |
| V1.0 | `tarot_mvp_345_v1.html` | MVP unifié 3/4/5 joueurs (05/10/2026) |
| V1.1 | `tarot_mvp_345_v1.1.html` | Correctifs des retours de Marc (19/10/2026) : Excuse jamais gardée pour le dernier pli (FFT), profil conservé d'une visite à l'autre, table dégagée du panneau d'info, couleurs rehaussées, explication des cartes non jouables |
| V1.2 | `tarot_mvp_345_v1.2.html` | Retours du point du 30/10/2026 : règle de la couleur appelée (interdite à l'entame du 1er tour seulement), clic unique pour jouer, sens antihoraire, animations de pli, preneur et Roi appelé visibles, chien montré en Petite/Garde, cartes agrandies et main entièrement visible (PC, téléphone paysage, Z Fold), compteur de points sans fuite de l'écart, bots qui protègent le Petit, multicompte, **Duplicate V0** (vivier Garde/Garde sans, jamais deux fois la même donne, enchères libres, comparaison à poste égal) |

## Historique complet du projet

Les maquettes V0.x intermédiaires et le dossier de cadrage sont conservés dans l'espace Notion du projet.

## Duplicate V0 (V1.2)

- Seules les donnes jouées en **Garde** ou **Garde sans** entrent au vivier.
- Un joueur ne rejoue jamais une donne déjà vue ; les enchères restent libres.
- Comparaison à poste égal (même main, même rôle) avec un % de topage.
- Limite de la maquette : vivier et profils stockés dans le navigateur (pas encore de serveur) ; une dizaine de donnes témoins par table sont fournies pour tester.
