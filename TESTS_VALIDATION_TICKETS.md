# 🧪 Guide de Tests - Validation Achat Tickets

## 🎯 Objectif

Valider que la correction du bug permet aux utilisateurs d'acheter un nouveau ticket lorsque l'ancien est expiré.

---

## ✅ Tests à Effectuer

### Test 1: Ticket SIMPLE Expiré (2 heures)

**Objectif:** Vérifier qu'on peut racheter après expiration de 2h

**Étapes:**
1. Acheter un ticket SIMPLE
2. Modifier manuellement la date d'achat à -3 heures dans la base de données:
   ```sql
   UPDATE tickets SET purchase_date = NOW() - INTERVAL 3 HOUR
   WHERE id = <ticket_id>;
   ```
3. Essayer d'acheter un nouveau ticket SIMPLE

**Résultat attendu:** ✅ Achat autorisé (ticket expiré après 2h)

**Résultat avant correction:** ❌ Erreur "ticket valide existe"

---

### Test 2: Ticket JOURNEE - Jour Suivant

**Objectif:** Vérifier qu'on peut racheter le lendemain

**Étapes:**
1. Acheter un ticket JOURNEE
2. Modifier la date d'achat à hier:
   ```sql
   UPDATE tickets SET purchase_date = DATE_SUB(NOW(), INTERVAL 1 DAY)
   WHERE id = <ticket_id>;
   ```
3. Essayer d'acheter un nouveau ticket JOURNEE

**Résultat attendu:** ✅ Achat autorisé (nouveau jour)

**Vérification supplémentaire:**
- Le statut de l'ancien ticket doit passer à "EXPIRE"
- Log doit montrer: `Statut du ticket X mis à jour vers EXPIRE`

---

### Test 3: Ticket HEBDO - Après 7 Jours

**Objectif:** Vérifier qu'on peut racheter après 7 jours

**Étapes:**
1. Acheter un ticket HEBDO
2. Modifier la date d'achat à -8 jours:
   ```sql
   UPDATE tickets SET purchase_date = DATE_SUB(NOW(), INTERVAL 8 DAY)
   WHERE id = <ticket_id>;
   ```
3. Essayer d'acheter un nouveau ticket HEBDO

**Résultat attendu:** ✅ Achat autorisé (expiré après 7 jours)

---

### Test 4: Ticket MENSUEL - Après 30 Jours

**Objectif:** Vérifier qu'on peut racheter après 30 jours

**Étapes:**
1. Acheter un ticket MENSUEL
2. Modifier la date d'achat à -31 jours:
   ```sql
   UPDATE tickets SET purchase_date = DATE_SUB(NOW(), INTERVAL 31 DAY)
   WHERE id = <ticket_id>;
   ```
3. Essayer d'acheter un nouveau ticket MENSUEL

**Résultat attendu:** ✅ Achat autorisé (expiré après 30 jours)

---

### Test 5: Ticket Encore Valide (Contrôle Négatif)

**Objectif:** Vérifier que l'achat est bien bloqué si ticket encore valide

**Étapes:**
1. Acheter un ticket SIMPLE
2. Attendre 30 minutes (ou juste après l'achat)
3. Essayer d'acheter un nouveau ticket SIMPLE

**Résultat attendu:** ❌ Erreur "L'utilisateur possède déjà un ticket valide"

**Ce test valide que:** La correction n'a pas cassé le comportement normal (pas de régression)

---

### Test 6: Ticket Utilisé (Scanné)

**Objectif:** Vérifier qu'on peut racheter après utilisation

**Étapes:**
1. Acheter un ticket SIMPLE
2. Scanner le QR code pour le valider (validation_date != null)
3. Essayer d'acheter un nouveau ticket SIMPLE

**Résultat attendu:** ✅ Achat autorisé (ticket déjà utilisé)

**Note:** Ce cas fonctionnait déjà avant, mais bon de le re-tester

---

### Test 7: Ticket Annulé

**Objectif:** Vérifier qu'on peut racheter après annulation

**Étapes:**
1. Acheter un ticket SIMPLE
2. L'annuler (demande de remboursement):
   ```sql
   UPDATE tickets SET status = 'ANNULE' WHERE id = <ticket_id>;
   ```
3. Essayer d'acheter un nouveau ticket SIMPLE

**Résultat attendu:** ✅ Achat autorisé (ticket annulé)

---

### Test 8: Mise à Jour Automatique du Statut

**Objectif:** Vérifier que le statut EXPIRE est bien mis à jour automatiquement

**Étapes:**
1. Acheter un ticket SIMPLE
2. Modifier la date d'achat à -3 heures
3. Essayer d'acheter un nouveau ticket SIMPLE
4. Vérifier la base de données:
   ```sql
   SELECT id, ticket_type, status, purchase_date
   FROM tickets
   WHERE user_id = <user_id>
   ORDER BY purchase_date DESC;
   ```

**Résultat attendu:**
- Ancien ticket: `status = 'EXPIRE'`
- Nouveau ticket: `status = 'VALIDE'`
- Log contient: `"Statut du ticket X mis à jour vers EXPIRE"`

---

### Test 9: Cas Limite - Exactement 2 Heures

**Objectif:** Vérifier le comportement à la limite exacte de 2h

**Étapes:**
1. Acheter un ticket SIMPLE
2. Modifier la date d'achat à exactement -2 heures:
   ```sql
   UPDATE tickets SET purchase_date = DATE_SUB(NOW(), INTERVAL 2 HOUR)
   WHERE id = <ticket_id>;
   ```
3. Essayer d'acheter un nouveau ticket SIMPLE

**Résultat attendu:** ✅ Achat autorisé (strictement après 2h = expiré)

**Note:** Vérifie que `now.isAfter(expirationDate)` est bien strict

---

### Test 10: Cas Limite - Minuit pour JOURNEE

**Objectif:** Vérifier le comportement à minuit pile

**Étapes:**
1. Acheter un ticket JOURNEE à 23h55
2. Modifier l'heure système ou attendre 6 minutes
3. Essayer d'acheter un nouveau ticket JOURNEE après minuit

**Résultat attendu:** ✅ Achat autorisé (jour suivant)

---

## 🔍 Commandes SQL Utiles

### Vérifier les tickets d'un utilisateur
```sql
SELECT id, ticket_type, status, purchase_date, validation_date,
       TIMESTAMPDIFF(HOUR, purchase_date, NOW()) as hours_since_purchase
FROM tickets
WHERE user_id = <user_id>
ORDER BY purchase_date DESC;
```

### Forcer l'expiration d'un ticket SIMPLE
```sql
UPDATE tickets
SET purchase_date = DATE_SUB(NOW(), INTERVAL 3 HOUR)
WHERE id = <ticket_id>;
```

### Forcer l'expiration d'un ticket JOURNEE
```sql
UPDATE tickets
SET purchase_date = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE id = <ticket_id>;
```

### Réinitialiser un ticket pour re-test
```sql
UPDATE tickets
SET status = 'VALIDE',
    validation_date = NULL,
    purchase_date = NOW()
WHERE id = <ticket_id>;
```

### Voir tous les statuts
```sql
SELECT status, COUNT(*) as count
FROM tickets
GROUP BY status;
```

---

## 📊 Matrice de Résultats Attendus

| Test | Type Ticket | Conditions | Avant Correction | Après Correction | Statut |
|------|-------------|------------|------------------|------------------|--------|
| 1 | SIMPLE | Expiré (3h) | ❌ Erreur | ✅ Achat OK | 🔧 **FIX** |
| 2 | JOURNEE | Jour suivant | ❌ Erreur | ✅ Achat OK | 🔧 **FIX** |
| 3 | HEBDO | Après 7j | ❌ Erreur | ✅ Achat OK | 🔧 **FIX** |
| 4 | MENSUEL | Après 30j | ❌ Erreur | ✅ Achat OK | 🔧 **FIX** |
| 5 | SIMPLE | Encore valide | ❌ Erreur | ❌ Erreur | ✅ OK (pas de régression) |
| 6 | SIMPLE | Utilisé | ✅ Achat OK | ✅ Achat OK | ✅ OK (pas de régression) |
| 7 | SIMPLE | Annulé | ✅ Achat OK | ✅ Achat OK | ✅ OK (pas de régression) |
| 8 | SIMPLE | Auto-update statut | N/A | ✅ EXPIRE | ✨ **NEW** |
| 9 | SIMPLE | Exactement 2h | ❌ Erreur | ✅ Achat OK | 🔧 **FIX** |
| 10 | JOURNEE | Minuit pile | ❌ Erreur | ✅ Achat OK | 🔧 **FIX** |

---

## 🐛 Vérification des Logs

Lors de l'achat après expiration, vous devriez voir dans les logs:

```
INFO  TicketService - Statut du ticket 123 mis à jour vers EXPIRE (type: SIMPLE, achat: 2025-11-28T10:00:00)
DEBUG TicketService - Ticket 123 de type SIMPLE expiré. Achat: 2025-11-28T10:00:00, Expiration: 2025-11-28T12:00:00, Maintenant: 2025-11-28T13:00:00
INFO  TicketService - Événement ticket.purchased publié pour le ticket 124
```

---

## ✅ Checklist Finale

Après tous les tests:

- [ ] Test 1 (SIMPLE expiré) : PASS
- [ ] Test 2 (JOURNEE jour suivant) : PASS
- [ ] Test 3 (HEBDO après 7j) : PASS
- [ ] Test 4 (MENSUEL après 30j) : PASS
- [ ] Test 5 (Ticket valide - contrôle négatif) : PASS
- [ ] Test 6 (Ticket utilisé) : PASS
- [ ] Test 7 (Ticket annulé) : PASS
- [ ] Test 8 (Auto-update statut) : PASS
- [ ] Test 9 (Limite 2h exactement) : PASS
- [ ] Test 10 (Minuit JOURNEE) : PASS
- [ ] Logs corrects affichés
- [ ] Pas de régression sur autres fonctionnalités
- [ ] Performance acceptable (pas de lenteur)

---

## 🚀 Déploiement

Une fois tous les tests validés:

```bash
# 1. Build le service
cd tickets-service
mvn clean package

# 2. Build l'image Docker
docker build -t tickets-service:latest .

# 3. Redéployer sur Kubernetes/Minikube
kubectl rollout restart deployment/tickets-service -n transport-prod

# 4. Vérifier les logs
kubectl logs -f deployment/tickets-service -n transport-prod
```

---

**Date:** 28 Novembre 2025
**Version:** 1.0 (Post-correction bug expiration)
