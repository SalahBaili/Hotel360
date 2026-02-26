import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const historiqueData = [
  { date: '26/02', occupancy: 85, tempMoy: 24, alertes: 2, consommation: 320 },
  { date: '25/02', occupancy: 72, tempMoy: 23, alertes: 1, consommation: 290 },
  { date: '24/02', occupancy: 90, tempMoy: 25, alertes: 3, consommation: 350 },
  { date: '23/02', occupancy: 65, tempMoy: 22, alertes: 0, consommation: 260 },
  { date: '22/02', occupancy: 78, tempMoy: 24, alertes: 2, consommation: 310 },
  { date: '21/02', occupancy: 95, tempMoy: 26, alertes: 4, consommation: 380 },
  { date: '20/02', occupancy: 60, tempMoy: 21, alertes: 1, consommation: 240 },
];

const eventsData = [
  { id: '1', type: 'login', icone: '🔐', message: 'Connexion admin — salah@hotel360.com', heure: '22:12', date: "Aujourd'hui" },
  { id: '2', type: 'alerte', icone: '🌡️', message: 'Alerte température — Chambre 104 (28°C)', heure: '22:05', date: "Aujourd'hui" },
  { id: '3', type: 'auto', icone: '❄️', message: 'Clim allumée automatiquement — Chambre 102', heure: '21:30', date: "Aujourd'hui" },
  { id: '4', type: 'alerte', icone: '🪟', message: 'Fenêtre ouverte détectée — Chambre 103', heure: '21:48', date: "Aujourd'hui" },
  { id: '5', type: 'auto', icone: '💡', message: 'Lumière éteinte automatiquement — Chambre 105', heure: '20:15', date: "Aujourd'hui" },
  { id: '6', type: 'login', icone: '🔐', message: 'Connexion réceptionniste — ahmed@hotel360.com', heure: '08:00', date: 'Hier' },
  { id: '7', type: 'alerte', icone: '⚡', message: 'Consommation anormale — Chambre 201', heure: '14:30', date: 'Hier' },
  { id: '8', type: 'auto', icone: '❄️', message: 'Clim éteinte — Chambre vide depuis 3h (205)', heure: '12:00', date: 'Hier' },
];

export default function HistoryScreen() {
  const router = useRouter();
  const [onglet, setOnglet] = useState('stats');

  const maxOccupancy = Math.max(...historiqueData.map(d => d.occupancy));

  const getEventColor = (type) => {
    switch (type) {
      case 'alerte': return '#E53935';
      case 'auto': return '#1565C0';
      case 'login': return '#2E7D32';
      default: return '#888';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Historique</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Onglets */}
      <View style={styles.onglets}>
        <TouchableOpacity
          style={[styles.onglet, onglet === 'stats' && styles.ongletActive]}
          onPress={() => setOnglet('stats')}
        >
          <Text style={[styles.ongletText, onglet === 'stats' && styles.ongletTextActive]}>
            📈 Statistiques
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.onglet, onglet === 'events' && styles.ongletActive]}
          onPress={() => setOnglet('events')}
        >
          <Text style={[styles.ongletText, onglet === 'events' && styles.ongletTextActive]}>
            📋 Événements
          </Text>
        </TouchableOpacity>
      </View>

      {onglet === 'stats' ? (
        <View>
          {/* Résumé semaine */}
          <Text style={styles.sectionTitle}>📅 Résumé — 7 derniers jours</Text>
          <View style={styles.resumeGrid}>
            <View style={[styles.resumeCard, { backgroundColor: '#1565C0' }]}>
              <Text style={styles.resumeNumber}>
                {Math.round(historiqueData.reduce((a, d) => a + d.occupancy, 0) / historiqueData.length)}%
              </Text>
              <Text style={styles.resumeLabel}>Taux occupation moyen</Text>
            </View>
            <View style={[styles.resumeCard, { backgroundColor: '#F57C00' }]}>
              <Text style={styles.resumeNumber}>
                {Math.round(historiqueData.reduce((a, d) => a + d.tempMoy, 0) / historiqueData.length)}°C
              </Text>
              <Text style={styles.resumeLabel}>Température moyenne</Text>
            </View>
            <View style={[styles.resumeCard, { backgroundColor: '#E53935' }]}>
              <Text style={styles.resumeNumber}>
                {historiqueData.reduce((a, d) => a + d.alertes, 0)}
              </Text>
              <Text style={styles.resumeLabel}>Total alertes</Text>
            </View>
            <View style={[styles.resumeCard, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.resumeNumber}>
                {Math.round(historiqueData.reduce((a, d) => a + d.consommation, 0) / historiqueData.length)}W
              </Text>
              <Text style={styles.resumeLabel}>Consommation moy</Text>
            </View>
          </View>

          {/* Graphique occupation */}
          <Text style={styles.sectionTitle}>📊 Taux d'Occupation (%)</Text>
          <View style={styles.graphCard}>
            <View style={styles.graph}>
              {historiqueData.map((d, i) => (
                <View key={i} style={styles.barContainer}>
                  <Text style={styles.barValue}>{d.occupancy}%</Text>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (d.occupancy / 100) * 120,
                          backgroundColor: d.occupancy > 80 ? '#E53935' : '#1565C0',
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.date}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Graphique alertes */}
          <Text style={styles.sectionTitle}>⚠️ Alertes par jour</Text>
          <View style={styles.graphCard}>
            <View style={styles.graph}>
              {historiqueData.map((d, i) => (
                <View key={i} style={styles.barContainer}>
                  <Text style={styles.barValue}>{d.alertes}</Text>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: d.alertes > 0 ? (d.alertes / 4) * 120 : 4,
                          backgroundColor: d.alertes > 2 ? '#E53935' : '#F57C00',
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.date}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tableau détaillé */}
          <Text style={styles.sectionTitle}>📋 Détail par jour</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Date</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Occup.</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Temp</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Alertes</Text>
            </View>
            {historiqueData.map((d, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={styles.tableCell}>{d.date}</Text>
                <Text style={[styles.tableCell, { color: d.occupancy > 80 ? '#E53935' : '#64B5F6' }]}>
                  {d.occupancy}%
                </Text>
                <Text style={[styles.tableCell, { color: '#F57C00' }]}>{d.tempMoy}°C</Text>
                <Text style={[styles.tableCell, { color: d.alertes > 2 ? '#E53935' : '#ccc' }]}>
                  {d.alertes}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View>
          {/* Liste événements */}
          <Text style={styles.sectionTitle}>📋 Journal des événements</Text>
          {['Aujourd\'hui', 'Hier'].map((date) => (
            <View key={date}>
              <Text style={styles.dateLabel}>{date}</Text>
              {eventsData.filter(e => e.date === date).map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={[styles.eventDot, { backgroundColor: getEventColor(event.type) }]} />
                  <Text style={styles.eventIcone}>{event.icone}</Text>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventMessage}>{event.message}</Text>
                    <Text style={styles.eventHeure}>🕐 {event.heure}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  backText: { color: '#64B5F6', fontSize: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  onglets: {
    flexDirection: 'row', marginHorizontal: 15, marginBottom: 15,
    backgroundColor: '#1E2D45', borderRadius: 12, padding: 4,
  },
  onglet: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  ongletActive: { backgroundColor: '#1565C0' },
  ongletText: { color: '#888', fontSize: 14, fontWeight: '500' },
  ongletTextActive: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#fff',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  resumeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 15, gap: 10,
  },
  resumeCard: {
    flex: 1, minWidth: '45%', borderRadius: 14,
    padding: 15, alignItems: 'center',
  },
  resumeNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  resumeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  graphCard: {
    marginHorizontal: 15, backgroundColor: '#1E2D45',
    borderRadius: 16, padding: 15,
  },
  graph: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barContainer: { alignItems: 'center', flex: 1 },
  barValue: { color: '#64B5F6', fontSize: 9, marginBottom: 4 },
  barWrapper: { height: 120, justifyContent: 'flex-end', width: '70%' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { color: '#888', fontSize: 9, marginTop: 6 },
  tableCard: {
    marginHorizontal: 15, backgroundColor: '#1E2D45',
    borderRadius: 16, overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#0A1628',
    paddingVertical: 12, paddingHorizontal: 15,
  },
  tableHeaderText: { color: '#64B5F6', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15 },
  tableRowAlt: { backgroundColor: '#162033' },
  tableCell: { flex: 1, color: '#ccc', fontSize: 13 },
  dateLabel: {
    color: '#64B5F6', fontSize: 14, fontWeight: 'bold',
    paddingHorizontal: 20, marginTop: 15, marginBottom: 8,
  },
  eventCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 15, marginBottom: 8,
    backgroundColor: '#1E2D45', borderRadius: 14,
    padding: 12, gap: 10,
  },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventIcone: { fontSize: 20 },
  eventContent: { flex: 1 },
  eventMessage: { color: '#fff', fontSize: 13, marginBottom: 4 },
  eventHeure: { color: '#888', fontSize: 11 },
});