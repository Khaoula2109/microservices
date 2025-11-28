# 🎫 Analyse Complète des Cas d'Achat de Tickets

## 🐛 Bug Identifié

**Problème:** Un utilisateur ne peut pas acheter un nouveau ticket même si son ticket précédent est expiré.

**Erreur:** `"L'utilisateur possède déjà un ticket valide de type: SIMPLE(ce ticket est expirér)"`

**Cause:** La méthode `checkForDuplicateValidTicket()` vérifie uniquement le statut "VALIDE" sans vérifier l'expiration.

---

## 📊 Analyse de Tous les Cas Possibles

### 1. Statuts des Tickets

Un ticket peut avoir les statuts suivants:
- **VALIDE** - Ticket acheté, pas encore utilisé ni expiré
- **ANNULE** - Ticket annulé (remboursement)
- **EXPIRE** - Ticket périmé (mis à jour lors du scan QR)
- **UTILISE** - Pas un statut formel, mais indiqué par `validationDate != null`

### 2. Durées de Validité

| Type Ticket | Durée de Validité |
|-------------|-------------------|
| SIMPLE      | 2 heures          |
| JOURNEE     | Jusqu'à 23h59 le jour d'achat |
| HEBDO       | 7 jours           |
| MENSUEL     | 30 jours          |

### 3. Cas d'Achat - Matrice de Décision

| # | Statut Ticket Existant | Expiration | Utilisation (validationDate) | **PEUT ACHETER?** | Raison |
|---|------------------------|------------|------------------------------|-------------------|---------|
| 1 | Aucun ticket | N/A | N/A | ✅ **OUI** | Pas de restriction |
| 2 | VALIDE | Non expiré | null (pas utilisé) | ❌ **NON** | Ticket encore valide |
| 3 | VALIDE | **EXPIRÉ** | null | ✅ **OUI** | Ticket périmé (BUG ACTUEL ❌) |
| 4 | VALIDE | Non expiré | != null (utilisé) | ✅ **OUI** | Ticket déjà consommé |
| 5 | VALIDE | EXPIRÉ | != null (utilisé) | ✅ **OUI** | Ticket utilisé et expiré |
| 6 | ANNULE | N/A | N/A | ✅ **OUI** | Ticket annulé |
| 7 | EXPIRE | N/A | N/A | ✅ **OUI** | Ticket expiré |
| 8 | VALIDE (JOURNEE) | Non expiré | null | ❌ **NON** | Valide jusqu'à 23h59 |
| 9 | VALIDE (JOURNEE) | Minuit passé | null | ✅ **OUI** | Jour suivant, peut racheter |
| 10 | VALIDE (HEBDO) | J+5 | null | ❌ **NON** | Encore 2 jours de validité |
| 11 | VALIDE (HEBDO) | J+8 | null | ✅ **OUI** | Expiré après 7 jours |

---

## 🔧 Correction Nécessaire

### Problème dans le Code Actuel

**Fichier:** `TicketService.java` ligne 357-368

```java
private void checkForDuplicateValidTicket(Long userId, String ticketType) {
    List<Ticket> userTickets = ticketRepository.findByUserIdAndTicketType(userId, ticketType);

    boolean hasValidTicket = userTickets.stream()
            .anyMatch(ticket -> "VALIDE".equals(ticket.getStatus()) && ticket.getValidationDate() == null);
    // ❌ NE VÉRIFIE PAS L'EXPIRATION!

    if (hasValidTicket) {
        throw new DuplicateTicketException(
                "L'utilisateur possède déjà un ticket valide de type: " + ticketType
        );
    }
}
```

### Solution

Ajouter une vérification d'expiration:

```java
private void checkForDuplicateValidTicket(Long userId, String ticketType) {
    List<Ticket> userTickets = ticketRepository.findByUserIdAndTicketType(userId, ticketType);

    boolean hasValidTicket = userTickets.stream()
            .anyMatch(ticket ->
                "VALIDE".equals(ticket.getStatus()) &&
                ticket.getValidationDate() == null &&
                !isTicketExpired(ticket)  // ✅ VÉRIFICATION AJOUTÉE
            );

    if (hasValidTicket) {
        throw new DuplicateTicketException(
                "L'utilisateur possède déjà un ticket valide de type: " + ticketType
        );
    }
}

// Méthode helper pour vérifier l'expiration
private boolean isTicketExpired(Ticket ticket) {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime purchaseDate = ticket.getPurchaseDate();
    LocalDateTime expirationDate;

    switch (ticket.getTicketType().toUpperCase()) {
        case "SIMPLE":
            expirationDate = purchaseDate.plusHours(2);
            break;
        case "JOURNEE":
            expirationDate = purchaseDate.toLocalDate().atTime(23, 59, 59);
            break;
        case "HEBDO":
            expirationDate = purchaseDate.plusDays(7);
            break;
        case "MENSUEL":
            expirationDate = purchaseDate.plusDays(30);
            break;
        default:
            expirationDate = purchaseDate.plusDays(1);
    }

    return now.isAfter(expirationDate);
}
```

---

## 📝 Scénarios de Test

### Scénario 1: Ticket SIMPLE expiré (BUG ACTUEL)

**Setup:**
- Utilisateur achète ticket SIMPLE à 10h00
- Il est maintenant 13h00 (3 heures plus tard)
- Ticket est expiré (validité: 2h)

**Comportement actuel:** ❌ Erreur "ticket valide existe"
**Comportement attendu:** ✅ Achat autorisé

### Scénario 2: Ticket JOURNEE le jour suivant

**Setup:**
- Utilisateur achète ticket JOURNEE le 27/11 à 14h00
- Il est maintenant le 28/11 à 08h00
- Ticket est expiré (validité: jusqu'à 23h59 du jour d'achat)

**Comportement actuel:** ❌ Erreur "ticket valide existe"
**Comportement attendu:** ✅ Achat autorisé

### Scénario 3: Ticket HEBDO après 7 jours

**Setup:**
- Utilisateur achète ticket HEBDO le 20/11
- Il est maintenant le 28/11 (8 jours plus tard)
- Ticket est expiré

**Comportement actuel:** ❌ Erreur "ticket valide existe"
**Comportement attendu:** ✅ Achat autorisé

### Scénario 4: Ticket valide non expiré

**Setup:**
- Utilisateur achète ticket SIMPLE à 10h00
- Il est maintenant 10h30 (30 minutes plus tard)
- Ticket est encore valide

**Comportement actuel:** ✅ Correct - Erreur "ticket valide existe"
**Comportement attendu:** ✅ Achat refusé (normal)

### Scénario 5: Ticket utilisé (scanné)

**Setup:**
- Utilisateur achète ticket SIMPLE à 10h00
- Ticket scanné/validé à 10h15 (validationDate != null)
- Il est maintenant 11h00

**Comportement actuel:** ✅ Correct - Achat autorisé (validationDate != null)
**Comportement attendu:** ✅ Achat autorisé

---

## 🎯 Impact de la Correction

### Avant (Bug)

```
Utilisateur achète SIMPLE à 10h00
10h00 → Achat OK ✅
11h00 → Peut utiliser (scan QR) ✅
12h30 → Ticket expiré (2h passées)
13h00 → Veut racheter → ❌ ERREUR "ticket valide existe"
```

**Résultat:** Utilisateur bloqué, ne peut pas racheter!

### Après (Corrigé)

```
Utilisateur achète SIMPLE à 10h00
10h00 → Achat OK ✅
11h00 → Peut utiliser (scan QR) ✅
12h30 → Ticket expiré (2h passées)
13h00 → Veut racheter → ✅ ACHAT AUTORISÉ
```

**Résultat:** Utilisateur peut racheter normalement!

---

## 🔄 Autres Améliorations Possibles

### 1. Mise à jour automatique des statuts expirés

Au lieu de mettre à jour le statut uniquement lors du scan, on pourrait:

```java
@Scheduled(fixedRate = 300000) // Toutes les 5 minutes
public void updateExpiredTickets() {
    List<Ticket> validTickets = ticketRepository.findByStatus("VALIDE");

    for (Ticket ticket : validTickets) {
        if (isTicketExpired(ticket)) {
            ticket.setStatus("EXPIRE");
            ticketRepository.save(ticket);
        }
    }
}
```

### 2. Notification avant expiration

Envoyer une notification push 30 minutes avant expiration:

```java
if (ticket.getTicketType().equals("SIMPLE")) {
    LocalDateTime expiresIn30Min = ticket.getPurchaseDate().plusHours(1).plusMinutes(30);
    // Programmer notification à expiresIn30Min
}
```

### 3. Extension automatique pour tickets non utilisés

Pour JOURNEE/HEBDO/MENSUEL non utilisés, permettre extension:

```java
public void extendTicket(Long ticketId, int days) {
    Ticket ticket = getTicketById(ticketId);
    if (ticket.getValidationDate() == null) {
        // Étendre la validité
    }
}
```

---

## ✅ Checklist de Validation

Après correction, vérifier:

- [ ] Ticket SIMPLE expiré → Achat autorisé
- [ ] Ticket JOURNEE jour suivant → Achat autorisé
- [ ] Ticket HEBDO après 7j → Achat autorisé
- [ ] Ticket MENSUEL après 30j → Achat autorisé
- [ ] Ticket valide non expiré → Achat refusé (OK)
- [ ] Ticket utilisé → Achat autorisé
- [ ] Ticket annulé → Achat autorisé
- [ ] Ticket EXPIRE (statut) → Achat autorisé

---

## 📚 Références

- **Fichier:** `tickets-service/src/main/java/com/example/ticketsservice/service/TicketService.java`
- **Méthode problématique:** `checkForDuplicateValidTicket()` (ligne 357)
- **Méthode avec logique expiration:** `validateByQrCode()` (ligne 268-298)

**Date d'analyse:** 28 Novembre 2025
