import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ProductCategory, CategoryPreferences } from '../../types';
import { CategoryPreferenceService } from '../../services/CategoryPreferenceService';
import { SafeAreaView } from "react-native-safe-area-context/lib/typescript/src/SafeAreaView";

interface CategorySelectionScreenProps {
  navigation: any;
  route?: {
    params?: {
      isInitialSetup?: boolean;
    };
  };
}

interface CategoryItem extends ProductCategory {
  selected: boolean;
}

const CategorySelectionScreen: React.FC<CategorySelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isInitialSetup = route?.params?.isInitialSetup || false;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const availableCategories = await CategoryPreferenceService.getAvailableCategories();
      const userPreferences = await CategoryPreferenceService.getUserPreferences();
      
      const categoriesWithSelection = availableCategories.map(category => ({
        ...category,
        selected: userPreferences.selectedCategories.includes(category.id),
      }));
      
      setCategories(categoriesWithSelection);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? { ...category, selected: !category.selected }
          : category
      )
    );
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const selectedCategories = categories
        .filter(category => category.selected)
        .map(category => category.id);

      if (selectedCategories.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one category.');
        return;
      }

      const preferences: CategoryPreferences = {
        selectedCategories,
        lastUpdated: new Date(),
      };

      await CategoryPreferenceService.saveUserPreferences(preferences);
      
      if (isInitialSetup) {
        navigation.replace('Main');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        item.selected && styles.categoryItemSelected,
      ]}
      onPress={() => toggleCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          item.selected && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
      {item.selected && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isInitialSetup ? 'Choose Your Interests' : 'Update Categories'}
        </Text>
        <Text style={styles.subtitle}>
          Select categories you're interested in to personalize your product feed
        </Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        style={styles.categoryList}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={savePreferences}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isInitialSetup ? 'Get Started' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#230234',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dddcdcff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b1b0b0ff',
    lineHeight: 22,
  },
  categoryList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  categoryItem: {
    flex: 0.48,
    backgroundColor: '#05cb72',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
  },
  categoryTextSelected: {
    color: '#2196f3',
  },
  checkmark: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  saveButton: {
    backgroundColor: '#05cb72',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategorySelectionScreen;