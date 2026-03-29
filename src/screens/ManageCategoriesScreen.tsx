import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import {RootStackParamList} from '../navigation/types';
import {Category, OTHER_CATEGORY_ID} from '../utils/constants';
import {
  addCategory,
  deleteCategory,
  getCategories,
  reorderCategories,
  updateCategory,
} from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageCategories'>;

const PRIMARY = '#2D6A4F';
const BG = '#F8FAF9';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1B1B2F';
const TEXT_SEC = '#6B7280';
const BORDER = '#E5E7EB';
const DANGER = '#EF4444';

const ICON_PRESETS = [
  '🍽️',
  '🛒',
  '👕',
  '🚗',
  '🛍️',
  '🎬',
  '💊',
  '🏠',
  '✈️',
  '💡',
];

const COLOR_PRESETS = [
  '#FF6B6B',
  '#2ECC71',
  '#9B59B6',
  '#4ECDC4',
  '#45B7D1',
  '#6C5CE7',
  '#E17055',
  '#0984E3',
  '#FDCB6E',
  '#16A085',
];

export function ManageCategoriesScreen({navigation}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [iconInput, setIconInput] = useState('🏷️');
  const [colorInput, setColorInput] = useState('#2D6A4F');

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setNameInput('');
    setIconInput('🏷️');
    setColorInput('#2D6A4F');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getCategories();
      setCategories(rows);
    } catch {
      Alert.alert('Error', 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const startEdit = useCallback((category: Category) => {
    setEditingId(category.id);
    setNameInput(category.label);
    setIconInput(category.icon);
    setColorInput(category.color);
  }, []);

  const onSubmit = useCallback(async () => {
    const label = nameInput.trim();
    const icon = iconInput.trim() || '🏷️';
    const color = colorInput.trim() || '#2D6A4F';

    if (!label) {
      Alert.alert('Name Required', 'Please enter a category name.');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      Alert.alert('Invalid Color', 'Use a hex color like #2D6A4F.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, {label, icon, color});
      } else {
        await addCategory({label, icon, color});
      }
      resetForm();
      await load();
    } catch {
      Alert.alert('Error', 'Could not save category. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [colorInput, editingId, iconInput, load, nameInput, resetForm]);

  const onDelete = useCallback(
    (category: Category) => {
      if (category.id === OTHER_CATEGORY_ID) {
        Alert.alert('Not Allowed', 'The Other category cannot be deleted.');
        return;
      }

      Alert.alert(
        'Delete Category',
        `Delete ${category.label}? Existing expenses will move to Other.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteCategory(category.id);
                if (editingId === category.id) {
                  resetForm();
                }
                await load();
              } catch {
                Alert.alert('Error', 'Could not delete category.');
              }
            },
          },
        ],
      );
    },
    [editingId, load, resetForm],
  );

  const onDragEnd = useCallback(
    async ({data}: {data: Category[]}) => {
      setCategories(data);
      setMoving(true);
      try {
        await reorderCategories(data.map(category => category.id));
      } catch {
        await load();
        Alert.alert('Error', 'Could not update category order.');
      } finally {
        setMoving(false);
      }
    },
    [load],
  );

  const renderCategoryItem = useCallback(
    ({item, drag, isActive}: RenderItemParams<Category>) => {
      const locked = item.id === OTHER_CATEGORY_ID;

      return (
        <View style={[styles.itemCard, isActive && styles.itemCardActive]}>
          <View style={[styles.iconWrap, {backgroundColor: `${item.color}20`}]}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
          </View>
          <View style={styles.itemBody}>
            <Text style={styles.itemName}>{item.label}</Text>
            <Text style={styles.itemSub}>{item.color}</Text>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={[styles.dragBtn, moving && styles.buttonDisabled]}
              onLongPress={drag}
              disabled={moving}
              delayLongPress={120}>
              <Text style={styles.dragBtnText}>≡</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => startEdit(item)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, locked && styles.buttonDisabled]}
              onPress={() => onDelete(item)}
              disabled={locked}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [moving, onDelete, startEdit],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DraggableFlatList
        data={categories}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onDragEnd={onDragEnd}
        renderItem={renderCategoryItem}
        activationDistance={8}
        ListHeaderComponent={
          <>
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>
                Long-press the {'≡'} handle and drag to reorder categories.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>
                {isEditing ? 'Edit Category' : 'Add Category'}
              </Text>

              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Eg: Gym"
                placeholderTextColor={TEXT_SEC}
                maxLength={30}
              />

              <Text style={styles.label}>Icon</Text>
              <TextInput
                style={styles.input}
                value={iconInput}
                onChangeText={setIconInput}
                placeholder="Eg: 🏋️"
                placeholderTextColor={TEXT_SEC}
                maxLength={2}
              />
              <View style={styles.choiceRow}>
                {ICON_PRESETS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.choiceChip,
                      iconInput === icon && styles.choiceChipSelected,
                    ]}
                    onPress={() => setIconInput(icon)}>
                    <Text style={styles.choiceChipText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                value={colorInput}
                onChangeText={setColorInput}
                placeholder="#2D6A4F"
                placeholderTextColor={TEXT_SEC}
                autoCapitalize="characters"
                maxLength={7}
              />
              <View style={styles.choiceRow}>
                {COLOR_PRESETS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorChip,
                      {backgroundColor: color},
                      colorInput.toLowerCase() === color.toLowerCase() &&
                        styles.colorChipSelected,
                    ]}
                    onPress={() => setColorInput(color)}
                  />
                ))}
              </View>

              <View style={styles.actionRow}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={resetForm}>
                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtn, saving && styles.buttonDisabled]}
                  onPress={onSubmit}
                  disabled={saving}>
                  <Text style={styles.primaryBtnText}>
                    {saving
                      ? 'Saving...'
                      : isEditing
                      ? 'Update Category'
                      : 'Add Category'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: BG},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  content: {padding: 16, paddingBottom: 30},
  hintCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SEC,
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_PRIMARY,
    fontSize: 15,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  choiceChip: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  choiceChipSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#EAF4EF',
  },
  choiceChipText: {fontSize: 16},
  colorChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  colorChipSelected: {
    borderWidth: 2,
    borderColor: TEXT_PRIMARY,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryBtnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 14},
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {color: TEXT_PRIMARY, fontWeight: '700', fontSize: 14},
  buttonDisabled: {opacity: 0.5},
  itemCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCardActive: {
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemIcon: {fontSize: 18},
  itemBody: {flex: 1},
  itemName: {fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY},
  itemSub: {fontSize: 12, color: TEXT_SEC, marginTop: 2},
  itemActions: {flexDirection: 'row', gap: 8},
  dragBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  dragBtnText: {color: TEXT_PRIMARY, fontWeight: '700', fontSize: 12},
  editBtn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editBtnText: {color: PRIMARY, fontWeight: '700', fontSize: 12},
  deleteBtn: {
    borderWidth: 1,
    borderColor: DANGER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtnText: {color: DANGER, fontWeight: '700', fontSize: 12},
  doneBtn: {
    marginTop: 4,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  doneBtnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15},
});
