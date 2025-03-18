import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const Drawing = () => {
  const [paths, setPaths] = useState([]); // Çizilen yollar
  const [currentPath, setCurrentPath] = useState(''); // Şu an çizilen yol
  const [selectedColor, setSelectedColor] = useState('black'); // Seçilen renk
  const svgRef = useRef();

  const handleTouchStart = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath(`M${locationX},${locationY}`); // Yeni bir yol başlat
  };

  const handleTouchMove = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath((prevPath) => `${prevPath} L${locationX},${locationY}`); // Yola yeni nokta ekle
  };

  const handleTouchEnd = () => {
    setPaths((prevPaths) => [...prevPaths, { path: currentPath, color: selectedColor }]); // Çizilen yolu kaydet
    setCurrentPath(''); // Şu anki yolu sıfırla
  };

  const clearDrawing = () => {
    setPaths([]); // Tüm yolları temizle
  };

  return (
    <View style={styles.container}>
      {/* Çizim Alanı */}
      <View
        style={styles.canvas}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
      >
        <Svg ref={svgRef} height={height} width={width} style={styles.svg}>
          {/* Çizilmiş yollar */}
          {paths.map((item, index) => (
            <Path key={index} d={item.path} stroke={item.color} strokeWidth={2} fill="none" />
          ))}
          {/* Şu an çizilen yol */}
          {currentPath !== '' && <Path d={currentPath} stroke={selectedColor} strokeWidth={2} fill="none" />}
        </Svg>
      </View>

      {/* Temizle Butonu */}
      <TouchableOpacity style={styles.clearButton} onPress={clearDrawing}>
        <Icon name="eraser" size={20} color="#fff" />
        <Text style={styles.clearButtonText}>Sil</Text>
      </TouchableOpacity>

      {/* Renk Seçenekleri */}
      <View style={styles.colorPalette}>
        {['black', 'red', 'blue', 'green', 'orange'].map((color) => (
          <TouchableOpacity
            key={color}
            style={[styles.colorOption, { backgroundColor: color }]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: '10%',
    right: 20,
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    elevation: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8, // İkon ve yazı arasındaki boşluk
    fontFamily:'Avenir'
  },
  colorPalette: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    left: '10%',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ccc',
  },
});

export default Drawing;
