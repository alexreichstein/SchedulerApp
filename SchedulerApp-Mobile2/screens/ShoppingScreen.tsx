// Inköpslisteskärmen
// Visar aktiva varor med checkboxar
// När man checkar i en vara tas den bort
// Favoritvaror kan läggas till snabbt

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShopping } from '../hooks/useShopping';
import { USERS, COLORS } from '../constants';

export default function ShoppingScreen() {
  // Aktiv användare
  const [activeUserId, setActiveUserId] = useState(1);

  // Text för ny vara
  const [newItem, setNewItem] = useState('');

  // Om favoritpanelen är synlig
  const [showFavorites, setShowFavorites] = useState(false);

  // Om "lägg till favorit"-fältet är synligt
  const [showAddFavorite, setShowAddFavorite] = useState(false);

  // Text för ny favorit
  const [newFavorite, setNewFavorite] = useState('');

  const {
    items,
    favorites,
    addItem,
    removeItem,
    addFavorite,
    removeFavorite,
    addFavoriteToList,
  } = useShopping();

  // Lägger till en vara i listan
  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    await addItem(newItem.trim(), activeUserId);
    setNewItem('');
  };

  // Checkar i en vara och tar bort den
  const handleCheck = (id: string, text: string) => {
    Alert.alert(
      `"${text}" tillagd?`,
      'Ta bort från listan?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => removeItem(id),
        },
      ]
    );
  };

  // Lägger till en ny favorit
  const handleAddFavorite = async () => {
    if (!newFavorite.trim()) return;
    await addFavorite(newFavorite.trim(), activeUserId);
    setNewFavorite('');
    setShowAddFavorite(false);
  };

  // Tar bort en favorit med bekräftelse
  const handleRemoveFavorite = (id: string, text: string) => {
    Alert.alert(
      `Ta bort favorit?`,
      `Vill du ta bort "${text}" från favoriter?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => removeFavorite(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Handla</Text>
        <TouchableOpacity
          style={styles.favoritesBtn}
          onPress={() => setShowFavorites(!showFavorites)}
        >
          <Text style={styles.favoritesBtnText}>
            {showFavorites ? 'Dölj favoriter' : '⭐ Favoriter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Användarväljare */}
      <View style={styles.userRow}>
        {Object.entries(USERS).map(([id, name]) => (
          <TouchableOpacity
            key={id}
            style={[
              styles.userBtn,
              activeUserId === Number(id) && {
                backgroundColor: COLORS[Number(id)],
              },
            ]}
            onPress={() => setActiveUserId(Number(id))}
          >
            <Text
              style={[
                styles.userBtnText,
                activeUserId === Number(id) && { color: '#fff' },
              ]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Favoritpanel */}
      {showFavorites && (
        <View style={styles.favoritesPanel}>
          <View style={styles.favoritesPanelHeader}>
            <Text style={styles.favoritesPanelTitle}>Favoritvaror</Text>
            <TouchableOpacity
              onPress={() => setShowAddFavorite(!showAddFavorite)}
            >
              <Text style={styles.addFavoriteBtn}>+ Ny favorit</Text>
            </TouchableOpacity>
          </View>

          {/* Lägg till ny favorit */}
          {showAddFavorite && (
            <View style={styles.addRow}>
              <TextInput
                style={styles.addFavoriteInput}
                placeholder="Ny favoritvara..."
                value={newFavorite}
                onChangeText={setNewFavorite}
                onSubmitEditing={handleAddFavorite}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: COLORS[activeUserId] }]}
                onPress={handleAddFavorite}
              >
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lista med favoriter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.favoritesRow}>
              {favorites.length === 0 ? (
                <Text style={styles.emptyFavorites}>Inga favoriter än</Text>
              ) : (
                favorites.map((fav) => (
                  <TouchableOpacity
                    key={fav.id}
                    style={styles.favoriteChip}
                    onPress={() => addFavoriteToList(fav, activeUserId)}
                    onLongPress={() => handleRemoveFavorite(fav.id, fav.text)}
                  >
                    <Text style={styles.favoriteChipText}>{fav.text}</Text>
                    <Text style={styles.favoriteChipAdd}>+</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
          <Text style={styles.favoriteHint}>
            Tryck för att lägga till i listan · Håll inne för att radera
          </Text>
        </View>
      )}

      {/* Lägg till vara */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Lägg till vara..."
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: COLORS[activeUserId] }]}
          onPress={handleAddItem}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Inköpslista */}
      <ScrollView style={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.empty}>Listan är tom — lägg till varor!</Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => handleCheck(item.id, item.text)}
            >
              {/* Checkbox */}
              <View style={[styles.checkbox, { borderColor: COLORS[item.addedBy] ?? '#ccc' }]} />
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemText}>{item.text}</Text>
                <Text style={[styles.itemUser, { color: COLORS[item.addedBy] ?? '#ccc' }]}>
                  {USERS[item.addedBy] ?? 'Okänd'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  favoritesBtn: {
    backgroundColor: '#f9a825',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  favoritesBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 8,
  },
  userBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  userBtnText: {
    fontWeight: '600',
    color: '#333',
  },
  favoritesPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },
  favoritesPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoritesPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addFavoriteBtn: {
    color: '#6200ee',
    fontWeight: '600',
    fontSize: 14,
  },
  addFavoriteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  favoritesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  favoriteChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  favoriteChipAdd: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '700',
  },
  favoriteHint: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyFavorites: {
    fontSize: 13,
    color: '#aaa',
    padding: 8,
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  itemUser: {
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#aaa',
    fontSize: 15,
  },
});